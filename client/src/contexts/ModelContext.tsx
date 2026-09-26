import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { getModels, type ChatModel } from "../utils/api";
import { useAuth } from "./AuthContext";

const STORAGE_KEY = "selected-model";

type ModelStatus = "loading" | "ready" | "error";

type ModelContextValue = {
  models: ChatModel[];
  // Model sent with chat requests; null lets the server use its default
  selectedModelId: string | null;
  status: ModelStatus;
  selectModel: (id: string) => void;
  reloadModels: () => void;
};

export const ModelContext = createContext<ModelContextValue>({
  models: [],
  selectedModelId: null,
  status: "loading",
  selectModel: () => {},
  reloadModels: () => {},
});

// Keep the saved model if it's still offered, else the server default, else the first one
function pickModel(
  models: ChatModel[],
  saved: string | null,
  defaultModel: string,
): string | null {
  const ids = models.map((m) => m.id);
  if (saved && ids.includes(saved)) return saved;
  if (ids.includes(defaultModel)) return defaultModel;
  return ids[0] ?? null;
}

export function ModelProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [models, setModels] = useState<ChatModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY),
  );
  const [status, setStatus] = useState<ModelStatus>("loading");

  const loadModels = useCallback(async () => {
    try {
      const res = await getModels();
      const list = res.data?.models ?? [];
      const picked = pickModel(
        list,
        localStorage.getItem(STORAGE_KEY),
        res.data?.defaultModel ?? "",
      );
      setModels(list);
      setSelectedModelId(picked);
      if (picked) localStorage.setItem(STORAGE_KEY, picked);
      setStatus("ready");
    } catch {
      // The saved choice can't be validated right now, so fall back to the
      // server default but keep it in storage for when the list loads again
      setModels([]);
      setSelectedModelId(null);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadModels();
  }, [isAuthenticated, loadModels]);

  function selectModel(id: string) {
    setSelectedModelId(id);
    localStorage.setItem(STORAGE_KEY, id);
  }

  function reloadModels() {
    setStatus("loading");
    loadModels();
  }

  return (
    <ModelContext.Provider
      value={{ models, selectedModelId, status, selectModel, reloadModels }}
    >
      {children}
    </ModelContext.Provider>
  );
}

export function useModel() {
  return useContext(ModelContext);
}
