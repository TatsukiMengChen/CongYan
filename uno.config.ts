import { defineConfig, presetUno, presetIcons } from "unocss";

export default defineConfig({
  presets: [
    presetUno(),
    presetIcons(),
  ],
  shortcuts: {
    "flex-center": "flex items-center justify-center",
  }
});
