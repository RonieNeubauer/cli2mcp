import type { CliShape, FlagSpec } from "./parser/shape.js";

export interface JsonSchemaProperty {
  type: "boolean" | "string" | "number" | "array";
  description?: string;
  enum?: string[];
  items?: { type: "string" | "number" | "boolean" };
}

export interface JsonSchema {
  type: "object";
  properties: Record<string, JsonSchemaProperty>;
  additionalProperties: false;
}

export function toInputSchema(shape: CliShape): JsonSchema {
  const properties: Record<string, JsonSchemaProperty> = {};

  for (const flag of shape.flags) {
    properties[flag.long] = buildFlagProperty(flag);
  }

  if (shape.positionals.length > 0) {
    properties.args = { type: "array", items: { type: "string" } };
  }

  return { type: "object", properties, additionalProperties: false };
}

function buildFlagProperty(flag: FlagSpec): JsonSchemaProperty {
  const base = flag.type === "choice" ? buildChoiceBase(flag) : buildScalarBase(flag);

  if (flag.repeatable) {
    const itemType = itemTypeFor(flag);
    const prop: JsonSchemaProperty = {
      type: "array",
      items: { type: itemType },
      description: flag.description || undefined,
    };
    if (!prop.description) delete prop.description;
    return prop;
  }

  return base;
}

function buildScalarBase(flag: FlagSpec): JsonSchemaProperty {
  const jsType = flag.type === "number" ? "number" : flag.type === "boolean" ? "boolean" : "string";
  const prop: JsonSchemaProperty = { type: jsType, description: flag.description || undefined };
  if (!prop.description) delete prop.description;
  return prop;
}

function buildChoiceBase(flag: FlagSpec): JsonSchemaProperty {
  const prop: JsonSchemaProperty = {
    type: "string",
    enum: flag.choices ?? [],
    description: flag.description || undefined,
  };
  if (!prop.description) delete prop.description;
  return prop;
}

function itemTypeFor(flag: FlagSpec): "string" | "number" | "boolean" {
  if (flag.type === "number") return "number";
  if (flag.type === "boolean") return "boolean";
  return "string";
}
