import * as SecureStore from "expo-secure-store";

const AI_API_KEY = "ai_api_key";

export async function getAiApiKey() {
  return await SecureStore.getItemAsync(AI_API_KEY);
}

export async function saveAiApiKey(apiKey: string) {
  await SecureStore.setItemAsync(AI_API_KEY, apiKey);
}

export async function deleteAiApiKey() {
  await SecureStore.deleteItemAsync(AI_API_KEY);
}
