import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// base: './' 使打包后的资源使用相对路径，
// 这样无论部署在 GitHub Pages 的哪个子路径下都能正常加载。
export default defineConfig({
  base: './',
  plugins: [vue()]
})
