/**
 * validateToolInput — kiểm tra đầu vào AI tool theo schema đã đăng ký
 */
import { base44 } from '@/api/base44Client';

/**
 * Validate input data against a tool's registered schema.
 * @param {string} toolName
 * @param {object} inputData
 * @returns {{ valid: boolean, errors?: string[], tool?: object }}
 */
export async function validateToolInput(toolName, inputData) {
  const tools = await base44.entities.AIToolDefinition.filter({ tool_name: toolName, is_active: true });

  if (!tools || tools.length === 0) {
    return { valid: false, errors: [`Tool "${toolName}" chưa được đăng ký hoặc đã bị tắt.`] };
  }

  const tool = tools[0];
  const schema = tool.input_schema;

  if (!schema) {
    // No schema defined → pass through
    return { valid: true, tool };
  }

  const errors = [];
  const properties = schema.properties || {};
  const required = schema.required || [];

  // Check required fields
  for (const field of required) {
    const value = inputData?.[field];
    if (value === undefined || value === null || value === '') {
      errors.push(`Trường "${field}" là bắt buộc.`);
    }
  }

  // Check types and enums for provided fields
  for (const [field, fieldSchema] of Object.entries(properties)) {
    const value = inputData?.[field];
    if (value === undefined || value === null) continue; // optional & missing → skip

    const expectedType = fieldSchema.type;
    const enumValues = fieldSchema.enum;
    const minLen = fieldSchema.minLength;
    const minimum = fieldSchema.minimum;
    const maximum = fieldSchema.maximum;
    const itemType = fieldSchema.items?.type;

    // Type check
    if (expectedType === 'number' && typeof value !== 'number') {
      errors.push(`Trường "${field}" phải là số (nhận được: ${typeof value}).`);
    } else if (expectedType === 'string' && typeof value !== 'string') {
      errors.push(`Trường "${field}" phải là chuỗi ký tự.`);
    } else if (expectedType === 'boolean' && typeof value !== 'boolean') {
      errors.push(`Trường "${field}" phải là boolean (true/false).`);
    } else if (expectedType === 'array' && !Array.isArray(value)) {
      errors.push(`Trường "${field}" phải là mảng (array).`);
    }

    // Enum check
    if (enumValues && !enumValues.includes(value)) {
      errors.push(`Trường "${field}" phải là một trong: ${enumValues.join(', ')}.`);
    }

    // minLength check (string)
    if (typeof value === 'string' && minLen !== undefined && value.length < minLen) {
      errors.push(`Trường "${field}" phải có ít nhất ${minLen} ký tự.`);
    }

    // range check (number)
    if (typeof value === 'number') {
      if (minimum !== undefined && value < minimum) {
        errors.push(`Trường "${field}" phải >= ${minimum}.`);
      }
      if (maximum !== undefined && value > maximum) {
        errors.push(`Trường "${field}" phải <= ${maximum}.`);
      }
    }

    // Array item type
    if (Array.isArray(value) && itemType) {
      value.forEach((item, idx) => {
        if (typeof item !== itemType) {
          errors.push(`Phần tử thứ ${idx + 1} trong "${field}" phải là ${itemType}.`);
        }
      });
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, tool };
  }

  return { valid: true, tool };
}