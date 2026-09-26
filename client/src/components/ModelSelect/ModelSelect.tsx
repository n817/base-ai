import { useModel } from "../../contexts/ModelContext";
import type { ChatModel } from "../../utils/api";

import "./ModelSelect.css";

// Group models by provider ("Qwen/Qwen3-..." -> "Qwen") for <optgroup>s
function groupByProvider(models: ChatModel[]) {
  const groups = new Map<string, ChatModel[]>();
  for (const model of models) {
    const provider = model.id.includes("/") ? model.id.split("/")[0]! : "Other";
    groups.set(provider, [...(groups.get(provider) ?? []), model]);
  }
  return [...groups];
}

export default function ModelSelect() {
  const { models, selectedModelId, status, selectModel, reloadModels } =
    useModel();

  if (status === "error") {
    return (
      <button
        type="button"
        className="model-select model-select_type_error"
        title="Couldn't load models, the default model is used. Click to retry."
        onClick={reloadModels}
      >
        Models unavailable · Retry
      </button>
    );
  }

  const isEmpty = status === "ready" && models.length === 0;

  return (
    <select
      className="model-select"
      aria-label="Model"
      title={selectedModelId ?? undefined}
      value={selectedModelId ?? ""}
      disabled={status === "loading" || isEmpty}
      onChange={(e) => selectModel(e.target.value)}
    >
      {status === "loading" && <option value="">Loading models…</option>}
      {isEmpty && <option value="">No models available</option>}
      {groupByProvider(models).map(([provider, group]) => (
        <optgroup key={provider} label={provider}>
          {group.map((model) => (
            <option key={model.id} value={model.id} title={model.id}>
              {model.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
