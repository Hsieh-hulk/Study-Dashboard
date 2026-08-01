# <img src="education.png" width="40" height="40" align="center" style="display:inline-block; vertical-align:middle; margin-right:8px;"> Study Dashboard (Happy Hues Edition + Supabase 雲端多群組版)

一個基於 **Happy Hues 繽紛設計語言** 的多功能學習資料管理系統，支援 **Supabase 雲端後端**、**Google OAuth 一鍵登入**、**6 位數邀請碼審核制群組**、**全員平權共享看板**、**多學制獨立預設模式**、**個人資料一鍵導入群組** 及 **Supabase Realtime 即時廣播同步**。

---

## 🚀 系統亮點與核心功能

### 1. ☁️ Supabase 雲端與 LocalStorage 雙引擎
- **雲端同步模式**：連結 Supabase 後，個人與群組資料將自動上傳雲端，支援跨裝置實時同步。
- **單機離線模式 (Fallback)**：未設定 Supabase 金鑰時，系統自動流暢降級至 LocalStorage 模式，離線亦可正常運作。

### 2. 🔐 Google OAuth 認證與個人檔案 Modal
- 支援 Google 帳號一鍵快捷登入。
- 首次登入彈出 Modal 設定個人暱稱與頭像（支援 Google 預設頭像或 DiceBear 隨機向量頭像生成）。

### 3. 👥 6 位數字邀請碼與審核制群組
- **創立群組**：任何登入使用者均可創建學習群組，系統會自動生成 6 位數字邀請碼（例如 `839201`）。
- **加入審核**：成員輸入邀請碼送出加入申請，管理員（群組建立者）會接收到紅點提醒，可於「群組管理 Modal」執行「同意」或「拒絕」。

### 4. 🔀 看板切換與全員共享平權制 (Dashboard Context)
- **看板自由切換**：頂端 Header 下拉選單可在 **「個人獨立看板」** 與 **「已加入的各個群組看板」** 自由切換。
- **全員平權共享**：群組看板採用平權機制，所有審核通過的群組成員均可新增、編輯與刪除科目、單元範圍及學習連結。

### 5. 📥 個人學習資料一鍵匯入群組 (Data Import)
- 切換至群組看板時，可點擊「匯入個人學習資料」按鈕。
- 支援勾選個人看板中的特定科目，一鍵將科目、單元範圍與資源連結批量匯入至群組共享看板中。

### 6. 🎓 多學制獨立隔離預設模式 (Preset School Modes)
- 支援一鍵切換預設學習階段範本：
  - 🎒 **國中模式** (國、英、數、物、理化、生、地科、歷、地、公民)
  - 🏫 **高中模式** (國、英、數、物、化、生、地科、歷、地、公民)
  - 🛠️ **高職模式** (國文、英文、數學、專一、專二)
  - 🎓 **大學 / 檢定模式** (微積分、微處理機、專題研究、英檢/證照等)
  - ✏️ **自訂空白看板**
- 各學制科目隔離保存，切換時保留原進度，可隨時復原。

### 7. ⚡ Supabase Realtime 即時廣播
- 訂閱 Postgres Changes 頻道廣播，當同群組成員新增講義網址或修改單元進度時，所有成員畫面 **零延遲即時更新**。

### 8. 🔍 全域搜尋系統 (`Ctrl + K` / `Cmd + K`)
- 按下快捷鍵 `Ctrl + K` 或 `Cmd + K` 可呼叫搜尋 Modal，即時過濾單元範圍與學習連結，並支援鍵盤 `↑` `↓` `Enter` 快速導航。

### 9. 🎨 三重護眼與繽紛主題 (Happy Hues Design System)
- 🌿 **舒緩森林 (Sage Green)** - 沉穩耐看的莫蘭迪綠色調，大幅降低長時間閱讀疲勞感。
- 🌙 **柔和夜讀 (Dusk Dark Mode)** - 晚間低藍光防刺眼暗色調。
- ☀️ **極簡明亮 (Pure Light)** - 清新高對比極簡風格。

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
- 設定完整的 Row Level Security (RLS) 權限與 Realtime 廣播 (`supabase_realtime`)

### 步驟二：設定 Google OAuth (選用)
1. 在 Supabase Dashboard 點擊 **Authentication -> Providers -> Google**。
2. 填入 GCP Console 取得的 `Client ID` 與 `Client Secret`。
3. 將 Redirect URL 新增至 GCP OAuth 允許的重定向網址中。

### 步驟三：於 Study Dashboard 連線
點擊網頁右上角的 ⚙️ 按鈕（或登入選單中的「Supabase 連線設定」），輸入您的 **Project URL** 與 **Anon Public Key** 即可開啟雲端同步！

---

## 💻 本地運行與開發

```bash
# 啟動 Node.js 本地靜態伺服器
npm start
```
伺服器運作於 `http://localhost:5500/`。

---

## 📁 專案檔案架構

- [`index.html`](file:///d:/Project/Vibe%20Codeing/Study%20Dashboard/index.html) - 主要前端 HTML/CSS/JS 應用程式 (SPA)
- [`supabase_schema.sql`](file:///d:/Project/Vibe%20Codeing/Study%20Dashboard/supabase_schema.sql) - Supabase 資料庫建表、RLS 權限與 Realtime 廣播腳本
- [`server.js`](file:///d:/Project/Vibe%20Codeing/Study%20Dashboard/server.js) - Node.js 本地靜態伺服器
- [`package.json`](file:///d:/Project/Vibe%20Codeing/Study%20Dashboard/package.json) - 專案配置與啟動腳本
- [`README.md`](file:///d:/Project/Vibe%20Codeing/Study%20Dashboard/README.md) - 專案說明與操作文件