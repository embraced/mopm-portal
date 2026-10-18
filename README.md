# mopm-portal

`https://mopm.tw/` 的原始碼：MOPM 多體學與精準醫學聯合會議的歷屆會議入口頁。

## 部署

- Cloudflare Pages，Git integration 部署 `main`。
- Build command 留空。Output directory 為 `/`。
- `www.mopm.tw` 由 Cloudflare Redirect Rule 301 到 `mopm.tw`，保留路徑。

## 檢查

```bash
npm test                      # 內容與 JSON-LD 測試（Node 內建 node:test，無相依套件）
bash scripts/check-links.sh   # 每個外部連結的 HTTP 狀態；mopmtaiwan.com 會擋 curl，要用瀏覽器開
python3 -m http.server 8080   # 本機預覽
```

## 每年新一屆開站時

1. 用瀏覽器開 `https://www.mopmtaiwan.com/`。如果內容已不是 2025，刪掉 2025 的官網連結，只留存檔。JSON-LD 2025 的 `url` 改成存檔網址。
2. `index.html`：把 `#current` 卡片換成新的一屆（年份、屆次、日期、地點、主辦、官網）。
3. `index.html`：在歷屆列表最上面加一列上一屆。連結用原網址（`20xx.mopm.tw` 不拆，本身就是存檔），連結類型「官網」。
4. `index.html`：JSON-LD 的 `subEvent` 最前面加新的一屆。新的一屆加 `eventStatus`，上一屆的 `eventStatus` 刪掉。
5. `tests/page.test.mjs`：更新年份、日期、`#current` 的 `data-year` 與網址清單。
6. `sitemap.xml`：更新 `lastmod`。
7. 執行 `npm test` 與 `bash scripts/check-links.sh`，都要通過。
8. commit、push `main`。部署後開 `https://mopm.tw/` 確認。

## 資料來源

歷屆資料在 2026-10-18 查證，來源是 Wayback Machine 存檔、各學會官網與議程 PDF。
2019、2021、2025 的主辦學會依六學會輪替順序推論，使用者已確認。
設計文件：`mopm-2026` repo 的 `docs/superpowers/specs/2026-10-18-mopm-portal-design.md`。
