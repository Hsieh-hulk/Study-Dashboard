# 📚 Study Dashboard (Happy Hues Edition + Supabase 雲端多群組版)

一個基於 **Happy Hues 繽紛設計語言** 的多功能學習資料管理系統，已升級支援 **Supabase 雲端後端**、**Google OAuth 一鍵登入**、**6 位數邀請碼審核制群組**、**全員平權共享看板** 及 **Supabase Realtime 即時同步**。

---

## 🚀 系統亮點與功能特色

1. **Supabase 雲端與 LocalStorage 雙引擎**
   - **雲端模式**：登入 Supabase 後資料全自動上雲，跨裝置隨時存取。
   - **單機離線模式 (Fallback)**：未設定 Supabase 金鑰時，自動暢行無阻地流暢降級至 LocalStorage 模式。

2. **Google OAuth 一鍵認證與個人檔案 Modal**
   - 支援 Google 帳號一鍵登入。
   - 首次登入彈出 Modal 設定暱稱與頭像（支援 Google 預設或 Dicebear 隨機生成頭像）。

3. **6 位數字邀請碼與審核制群組**
   - 任何登入使用者皆可創立學習群組，系統自動生成 6 位數字邀請碼（例如 `839201`）。
   - 其他成員輸入 6 位數字邀請碼發送加入申請。
   - 管理員（群組建立者）收到紅點提示，可在「群組管理 Modal」點擊「同意」或「拒絕」。

4. **看板切換與全員共享平權制 (Dashboard Context)**
   - 頂端 Header 下拉選單可在 **「個人獨立看板」** 與 **「已加入的各個群組看板」** 自由切換。
   - 群組看板採 **全員共享平權制**：所有審核通過的群組成員均可新增、編輯與刪除科目、單元範圍及學習連結。

5. **Supabase Realtime 即時廣播同步**
   - 訂閱 Postgres Changes 廣播，當同群組成員新增講義網址或修改單元時，所有成員畫面 **零延遲即時更新**。

6. **全域搜尋系統 (`Ctrl + K`)**
   - 支援全域快捷鍵 `Ctrl + K` 呼叫 Modal 搜尋，可即時過濾科目、單元與連結，鍵盤 `↑` `↓` `Enter` 快速切換。

7. **雙重護眼主題 (Happy Hues Design System)**
   - 🌿 舒緩森林 (Sage Green - 放鬆眼肌首選)
   - 🌙 柔和夜讀 (Dusk Dark Mode)

---

## 🛠️ Supabase 設定指南

### 步驟一：執行 SQL 腳本檔
請開啟 Supabase 專案後台，點選左側 **SQL Editor**，複製專案根目錄下的 [`supabase_schema.sql`](file:///d:/Project/Vibe%20Codeing/Study%20Dashboard/supabase_schema.sql) 內容並執行。此腳本將自動建立：
- `profiles` (個人檔案)
- `groups` (群組)
- `group_members` (群組成員)
- `group_join_requests` (加入申請)
- `subjects` (科目)
- `ranges` (單元範圍)
- `resource_links` (學習資源連結)
- 設定完整的 Row Level Security (RLS) 權限
- 啟用 Supabase Realtime 即時廣播 (`supabase_realtime`)

### 步驟二：設定 Google OAuth (選用)
1. 在 Supabase Dashboard 點擊 **Authentication -> Providers -> Google**。
2. 填入 GCP Console 取得的 `Client ID` 與 `Client Secret`。
3. 將 Redirect URL 新增至 GCP OAuth 允許的重定向網址中。

### 步驟三：於 Study Dashboard 連線
點擊網頁右上角的 ⚙️ 按鈕（或登入按鈕選單中的「Supabase 連線設定」），輸入您的 **Project URL** 與 **Anon Public Key** 即可開啟雲端同步！

---

## 📁 專案檔案架構

- [`index.html`](file:///d:/Project/Vibe%20Codeing/Study%20Dashboard/index.html) - 主要前端 HTML/CSS/JS 應用程式
- [`supabase_schema.sql`](file:///d:/Project/Vibe%20Codeing/Study%20Dashboard/supabase_schema.sql) - Supabase 資料庫建表與 RLS 腳本
- [`README.md`](file:///d:/Project/Vibe%20Codeing/Study%20Dashboard/README.md) - 專案說明與說明文件