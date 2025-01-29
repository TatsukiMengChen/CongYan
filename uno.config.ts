import { defineConfig, presetUno, presetIcons } from "unocss";

export default defineConfig({
  presets: [
    presetUno(),
    presetIcons(),
  ],
  shortcuts: {
    "flex-center": "flex items-center justify-center",
    "flex-between": "flex items-center justify-between",
    "flex-around": "flex items-center justify-around"
  }
});
