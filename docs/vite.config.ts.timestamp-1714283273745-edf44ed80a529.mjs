// vite.config.ts
import { resolve } from "node:path";
import { defineConfig } from "file:///D:/workspace/vite/packages/vite/dist/node/index.js";
import Icons from "file:///D:/workspace/slidev/slidev/node_modules/.pnpm/unplugin-icons@0.18.5_@vue+compiler-sfc@3.4.22/node_modules/unplugin-icons/dist/vite.js";
import IconsResolver from "file:///D:/workspace/slidev/slidev/node_modules/.pnpm/unplugin-icons@0.18.5_@vue+compiler-sfc@3.4.22/node_modules/unplugin-icons/dist/resolver.js";
import Components from "file:///D:/workspace/slidev/slidev/node_modules/.pnpm/unplugin-vue-components@0.26.0_vue@3.4.22/node_modules/unplugin-vue-components/dist/vite.js";
import Inspect from "file:///D:/workspace/slidev/slidev/node_modules/.pnpm/vite-plugin-inspect@0.8.3_vite@3.2.8/node_modules/vite-plugin-inspect/dist/index.mjs";
import UnoCSS from "file:///D:/workspace/slidev/slidev/node_modules/.pnpm/unocss@0.59.3_postcss@8.4.38_vite@3.2.8/node_modules/unocss/dist/vite.mjs";
var __vite_injected_original_dirname = "D:\\workspace\\slidev\\slidev\\docs";
var vite_config_default = defineConfig({
  resolve: {
    alias: {
      "@slidev/client/": `${resolve(__vite_injected_original_dirname, ".vitepress/@slidev/client")}/`,
      "@slidev/parser": resolve(__vite_injected_original_dirname, ".vitepress/@slidev/parser"),
      "@slidev/theme-default": resolve(__vite_injected_original_dirname, ".vitepress/@slidev/theme-default")
    }
  },
  optimizeDeps: {
    exclude: [
      "vue-demi",
      "@vueuse/shared",
      "@vueuse/core"
    ]
  },
  server: {
    hmr: {
      overlay: false
    }
  },
  plugins: [
    Components({
      dirs: [
        "./.vitepress/theme/components",
        "./.vitepress/@slidev/client/builtin"
      ],
      extensions: ["vue", "md"],
      include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
      resolvers: [
        IconsResolver({
          prefix: ""
        })
      ]
    }),
    Icons({
      defaultStyle: "display: inline-block;"
    }),
    Inspect(),
    UnoCSS(),
    {
      name: "code-block-escape",
      enforce: "post",
      transform(code, id) {
        if (!id.endsWith(".md"))
          return;
        return code.replace(/\/\/```/mg, "```");
      }
    },
    {
      name: "virtual-modules",
      resolveId(id) {
        return id === "/@slidev/configs" ? id : null;
      },
      load(id) {
        if (id !== "/@slidev/configs")
          return;
        return "export default {}";
      }
    }
  ]
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFx3b3Jrc3BhY2VcXFxcc2xpZGV2XFxcXHNsaWRldlxcXFxkb2NzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFx3b3Jrc3BhY2VcXFxcc2xpZGV2XFxcXHNsaWRldlxcXFxkb2NzXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi93b3Jrc3BhY2Uvc2xpZGV2L3NsaWRldi9kb2NzL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ25vZGU6cGF0aCdcclxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IEljb25zIGZyb20gJ3VucGx1Z2luLWljb25zL3ZpdGUnXHJcbmltcG9ydCBJY29uc1Jlc29sdmVyIGZyb20gJ3VucGx1Z2luLWljb25zL3Jlc29sdmVyJ1xyXG5pbXBvcnQgQ29tcG9uZW50cyBmcm9tICd1bnBsdWdpbi12dWUtY29tcG9uZW50cy92aXRlJ1xyXG5pbXBvcnQgSW5zcGVjdCBmcm9tICd2aXRlLXBsdWdpbi1pbnNwZWN0J1xyXG5pbXBvcnQgVW5vQ1NTIGZyb20gJ3Vub2Nzcy92aXRlJ1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICAnQHNsaWRldi9jbGllbnQvJzogYCR7cmVzb2x2ZShfX2Rpcm5hbWUsICcudml0ZXByZXNzL0BzbGlkZXYvY2xpZW50Jyl9L2AsXHJcbiAgICAgICdAc2xpZGV2L3BhcnNlcic6IHJlc29sdmUoX19kaXJuYW1lLCAnLnZpdGVwcmVzcy9Ac2xpZGV2L3BhcnNlcicpLFxyXG4gICAgICAnQHNsaWRldi90aGVtZS1kZWZhdWx0JzogcmVzb2x2ZShfX2Rpcm5hbWUsICcudml0ZXByZXNzL0BzbGlkZXYvdGhlbWUtZGVmYXVsdCcpLFxyXG4gICAgfSxcclxuICB9LFxyXG4gIG9wdGltaXplRGVwczoge1xyXG4gICAgZXhjbHVkZTogW1xyXG4gICAgICAndnVlLWRlbWknLFxyXG4gICAgICAnQHZ1ZXVzZS9zaGFyZWQnLFxyXG4gICAgICAnQHZ1ZXVzZS9jb3JlJyxcclxuICAgIF0sXHJcbiAgfSxcclxuICBzZXJ2ZXI6IHtcclxuICAgIGhtcjoge1xyXG4gICAgICBvdmVybGF5OiBmYWxzZSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBwbHVnaW5zOiBbXHJcbiAgICBDb21wb25lbnRzKHtcclxuICAgICAgZGlyczogW1xyXG4gICAgICAgICcuLy52aXRlcHJlc3MvdGhlbWUvY29tcG9uZW50cycsXHJcbiAgICAgICAgJy4vLnZpdGVwcmVzcy9Ac2xpZGV2L2NsaWVudC9idWlsdGluJyxcclxuICAgICAgXSxcclxuICAgICAgZXh0ZW5zaW9uczogWyd2dWUnLCAnbWQnXSxcclxuICAgICAgaW5jbHVkZTogWy9cXC52dWUkLywgL1xcLnZ1ZVxcP3Z1ZS8sIC9cXC5tZCQvXSxcclxuICAgICAgcmVzb2x2ZXJzOiBbXHJcbiAgICAgICAgSWNvbnNSZXNvbHZlcih7XHJcbiAgICAgICAgICBwcmVmaXg6ICcnLFxyXG4gICAgICAgIH0pLFxyXG4gICAgICBdLFxyXG4gICAgfSksXHJcbiAgICBJY29ucyh7XHJcbiAgICAgIGRlZmF1bHRTdHlsZTogJ2Rpc3BsYXk6IGlubGluZS1ibG9jazsnLFxyXG4gICAgfSksXHJcbiAgICBJbnNwZWN0KCksXHJcbiAgICBVbm9DU1MoKSxcclxuICAgIHtcclxuICAgICAgbmFtZTogJ2NvZGUtYmxvY2stZXNjYXBlJyxcclxuICAgICAgZW5mb3JjZTogJ3Bvc3QnLFxyXG4gICAgICB0cmFuc2Zvcm0oY29kZSwgaWQpIHtcclxuICAgICAgICBpZiAoIWlkLmVuZHNXaXRoKCcubWQnKSlcclxuICAgICAgICAgIHJldHVyblxyXG4gICAgICAgIHJldHVybiBjb2RlLnJlcGxhY2UoL1xcL1xcL2BgYC9tZywgJ2BgYCcpXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICBuYW1lOiAndmlydHVhbC1tb2R1bGVzJyxcclxuICAgICAgcmVzb2x2ZUlkKGlkKSB7XHJcbiAgICAgICAgcmV0dXJuIGlkID09PSAnL0BzbGlkZXYvY29uZmlncycgPyBpZCA6IG51bGxcclxuICAgICAgfSxcclxuICAgICAgbG9hZChpZCkge1xyXG4gICAgICAgIGlmIChpZCAhPT0gJy9Ac2xpZGV2L2NvbmZpZ3MnKVxyXG4gICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgcmV0dXJuICdleHBvcnQgZGVmYXVsdCB7fSdcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgXSxcclxufSlcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF5UixTQUFTLGVBQWU7QUFDalQsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sbUJBQW1CO0FBQzFCLE9BQU8sZ0JBQWdCO0FBQ3ZCLE9BQU8sYUFBYTtBQUNwQixPQUFPLFlBQVk7QUFObkIsSUFBTSxtQ0FBbUM7QUFRekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsbUJBQW1CLEdBQUcsUUFBUSxrQ0FBVywyQkFBMkIsQ0FBQztBQUFBLE1BQ3JFLGtCQUFrQixRQUFRLGtDQUFXLDJCQUEyQjtBQUFBLE1BQ2hFLHlCQUF5QixRQUFRLGtDQUFXLGtDQUFrQztBQUFBLElBQ2hGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsY0FBYztBQUFBLElBQ1osU0FBUztBQUFBLE1BQ1A7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixLQUFLO0FBQUEsTUFDSCxTQUFTO0FBQUEsSUFDWDtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLFdBQVc7QUFBQSxNQUNULE1BQU07QUFBQSxRQUNKO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxNQUNBLFlBQVksQ0FBQyxPQUFPLElBQUk7QUFBQSxNQUN4QixTQUFTLENBQUMsVUFBVSxjQUFjLE9BQU87QUFBQSxNQUN6QyxXQUFXO0FBQUEsUUFDVCxjQUFjO0FBQUEsVUFDWixRQUFRO0FBQUEsUUFDVixDQUFDO0FBQUEsTUFDSDtBQUFBLElBQ0YsQ0FBQztBQUFBLElBQ0QsTUFBTTtBQUFBLE1BQ0osY0FBYztBQUFBLElBQ2hCLENBQUM7QUFBQSxJQUNELFFBQVE7QUFBQSxJQUNSLE9BQU87QUFBQSxJQUNQO0FBQUEsTUFDRSxNQUFNO0FBQUEsTUFDTixTQUFTO0FBQUEsTUFDVCxVQUFVLE1BQU0sSUFBSTtBQUNsQixZQUFJLENBQUMsR0FBRyxTQUFTLEtBQUs7QUFDcEI7QUFDRixlQUFPLEtBQUssUUFBUSxhQUFhLEtBQUs7QUFBQSxNQUN4QztBQUFBLElBQ0Y7QUFBQSxJQUNBO0FBQUEsTUFDRSxNQUFNO0FBQUEsTUFDTixVQUFVLElBQUk7QUFDWixlQUFPLE9BQU8scUJBQXFCLEtBQUs7QUFBQSxNQUMxQztBQUFBLE1BQ0EsS0FBSyxJQUFJO0FBQ1AsWUFBSSxPQUFPO0FBQ1Q7QUFDRixlQUFPO0FBQUEsTUFDVDtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
