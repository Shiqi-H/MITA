import { config } from '../config.js';

/**
 * @typedef {Object} ParsedIntent
 * @property {'query_info'|'compare'|'query_attribute'|'unknown'} intent
 * @property {string|null} referent          - 'current_selection' or a plant name
 * @property {string|null} comparison_target - Plant name to compare against
 * @property {'medicinal'|'botanical'|'toxicity'|'drought'|'feng_shui'|null} interest_slot
 * @property {'front'|'back'|'left'|'right'|null} position_hint
 */

/**
 * Low-level wrapper around the OpenAI-compatible Chat Completions API.
 * @param {Object[]} messages
 * @param {{ jsonMode?: boolean }} [opts]
 * @returns {Promise<string>}
 */
async function chatCompletion(messages, opts = {}) {
  const body = {
    model: config.openai.model,
    messages,
    temperature: 0.2,
  };
  if (opts.jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch(`${config.openai.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.openai.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`LLM API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

// ─────────────────────────────────────────────
// Intent Parsing
// ─────────────────────────────────────────────

const INTENT_SYSTEM_PROMPT = `你是一个植物园智能导览系统的意图解析器。
用户会用自然语言（中文或英文）询问关于植物的问题，同时提供：
- 当前通过鼠标点击/射线检测命中的植物ID列表
- 会话中已访问过的植物历史记录

你必须返回严格的 JSON 对象，不允许包含任何额外文字。

JSON 字段说明：
- intent: "query_info"（询问概述）| "compare"（对比两株植物）| "query_attribute"（询问特定属性）| "unknown"
- referent: 用户指代的植物，值为 "current_selection" 或历史中某植物的名称；若无法判断填 null
- comparison_target: 对比目标植物的名称（仅 compare intent 时填写），否则 null
- interest_slot: 用户兴趣约束，值为以下之一或 null：
    "medicinal"（药用价值）| "botanical"（植物学特征）| "toxicity"（毒性）| "drought"（耐旱性）| "feng_shui"（风水）
- position_hint: 当用户用位置词消歧义时填写，值为 "front" | "back" | "left" | "right"，否则 null

示例输入/输出：
用户说："这是什么？" → {"intent":"query_info","referent":"current_selection","comparison_target":null,"interest_slot":null,"position_hint":null}
用户说："它比刚才看到的大王莲更耐旱吗？" → {"intent":"compare","referent":"current_selection","comparison_target":"大王莲","interest_slot":"drought","position_hint":null}
用户说："我想了解这棵树的药用价值" → {"intent":"query_attribute","referent":"current_selection","comparison_target":null,"interest_slot":"medicinal","position_hint":null}
用户说："后面那个" → {"intent":"query_info","referent":null,"comparison_target":null,"interest_slot":null,"position_hint":"back"}
用户说："B" → {"intent":"query_info","referent":"B","comparison_target":null,"interest_slot":null,"position_hint":null}`;

/**
 * Parse user speech into a structured intent.
 * @param {string} userText
 * @param {string[]} hitIds    - Current raycaster hit IDs
 * @param {Object[]} visited   - Session visited list
 * @param {Object[]} history   - Conversation history (last N turns)
 * @returns {Promise<ParsedIntent>}
 */
export async function parseIntent(userText, hitIds, visited, history) {
  const contextNote = [
    `当前命中植物ID：[${hitIds.join(', ')}]`,
    visited.length > 0
      ? `已访问植物：${visited.map((v) => v.plantName).join('、')}`
      : '（暂无访问历史）',
  ].join('\n');

  const messages = [
    { role: 'system', content: INTENT_SYSTEM_PROMPT },
    // Inject recent conversation history for context
    ...history.slice(-6),
    { role: 'user', content: `${contextNote}\n\n用户说：「${userText}」` },
  ];

  const raw = await chatCompletion(messages, { jsonMode: true });

  try {
    return JSON.parse(raw);
  } catch {
    return {
      intent: 'unknown',
      referent: null,
      comparison_target: null,
      interest_slot: null,
      position_hint: null,
    };
  }
}

// ─────────────────────────────────────────────
// Response Generation
// ─────────────────────────────────────────────

/**
 * Generate a natural-language TTS response for a plant info query.
 * @param {Object} plant      - Full plant record from DB
 * @param {string|null} slot  - interest_slot (e.g. "medicinal"), or null for general info
 * @param {Object[]} history  - Conversation history
 * @returns {Promise<string>}
 */
export async function generateInfoResponse(plant, slot, history) {
  let context;
  if (slot === 'medicinal') {
    context = `植物：${plant.name}（${plant.scientific_name}）\n药用信息：${plant.medical_info.summary}\n注意事项：${plant.medical_info.caution}`;
  } else if (slot === 'botanical') {
    context = `植物：${plant.name}（${plant.scientific_name}）\n植物学特征：${plant.botanical_info}`;
  } else if (slot === 'toxicity') {
    context = `植物：${plant.name}（${plant.scientific_name}）\n毒性信息：${plant.attributes.toxicity}`;
  } else if (slot === 'drought') {
    context = `植物：${plant.name}（${plant.scientific_name}）\n耐旱性：${plant.attributes.drought_tolerance}`;
  } else if (slot === 'feng_shui') {
    context = plant.feng_shui_info
      ? `植物：${plant.name}（${plant.scientific_name}）\n风水信息：${plant.feng_shui_info}`
      : `植物：${plant.name}（${plant.scientific_name}）\n数据库中没有关于风水的信息。`;
  } else {
    context = `植物：${plant.name}（${plant.scientific_name}）\n简介：${plant.description}\n生长特征：高度 ${plant.attributes.height}，${plant.attributes.lifespan}，耐旱性：${plant.attributes.drought_tolerance}，毒性：${plant.attributes.toxicity}。`;
  }

  const messages = [
    {
      role: 'system',
      content:
        '你是一位植物园智能导览员，用简洁、友好、自然的口语化中文回答游客的问题。回答在100字以内，不要使用列表格式，直接用流畅的句子。',
    },
    ...history.slice(-4),
    { role: 'user', content: context },
  ];

  return chatCompletion(messages);
}

/**
 * Generate a TTS response for a plant comparison query.
 * @param {Object} plant1
 * @param {Object} plant2
 * @param {string|null} slot  - The attribute being compared
 * @param {Object[]} history
 * @returns {Promise<string>}
 */
export async function generateCompareResponse(plant1, plant2, slot, history) {
  let attr1, attr2, attrLabel;

  if (slot === 'drought') {
    attr1 = plant1.attributes.drought_tolerance;
    attr2 = plant2.attributes.drought_tolerance;
    attrLabel = '耐旱性';
  } else if (slot === 'toxicity') {
    attr1 = plant1.attributes.toxicity;
    attr2 = plant2.attributes.toxicity;
    attrLabel = '毒性';
  } else {
    attr1 = plant1.description;
    attr2 = plant2.description;
    attrLabel = '综合特征';
  }

  const context = [
    `对比植物：${plant1.name}（${plant1.scientific_name}）vs ${plant2.name}（${plant2.scientific_name}）`,
    `对比维度：${attrLabel}`,
    `${plant1.name} 的${attrLabel}：${attr1}`,
    `${plant2.name} 的${attrLabel}：${attr2}`,
  ].join('\n');

  const messages = [
    {
      role: 'system',
      content:
        '你是一位植物园智能导览员。根据以下数据，用简洁自然的口语中文对比两种植物，给出明确结论，100字以内。',
    },
    ...history.slice(-4),
    { role: 'user', content: context },
  ];

  return chatCompletion(messages);
}

/**
 * Generate a clarification question for disambiguation.
 * @param {Array<{id:string, name:string, label:string, positionDesc:string}>} candidates
 * @returns {Promise<string>}
 */
export async function generateDisambiguationQuestion(candidates) {
  const desc = candidates
    .map((c) => `${c.label}（${c.positionDesc}的${c.name}）`)
    .join('、');

  const messages = [
    {
      role: 'system',
      content:
        '你是一位植物园导览员，用自然友好的口语中文询问游客具体指的是哪株植物，30字以内。',
    },
    {
      role: 'user',
      content: `射线同时命中了这些植物：${desc}。请生成一个澄清问句。`,
    },
  ];

  return chatCompletion(messages);
}

/**
 * Generate a fallback response when requested info is not in the database.
 * @param {Object} plant
 * @param {string} requestedSlot
 * @param {string[]} availableSlots
 * @returns {Promise<string>}
 */
export async function generateFallbackResponse(plant, requestedSlot, availableSlots) {
  const available = availableSlots.join('、');
  const messages = [
    {
      role: 'system',
      content:
        '你是植物园导览员，友好地告知游客所请求的信息不存在，并提供可用选项，50字以内。',
    },
    {
      role: 'user',
      content: `游客询问 ${plant.name} 的「${requestedSlot}」信息，但数据库中没有。可用信息类型有：${available}。`,
    },
  ];

  return chatCompletion(messages);
}
