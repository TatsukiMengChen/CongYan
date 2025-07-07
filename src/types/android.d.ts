declare namespace Android {
  function showToast(message: string): void;
  function openUrlInNewActivity(url: string): void;
  function predictIntelligibilityFromBase64(
    audioDataAsBase64: string,
    callbackFuncName: string,
  ): void;
  function isModelLoaded(): boolean;
  function getModelStatus(): string;
}
