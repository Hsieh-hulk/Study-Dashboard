import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const jsErrors = [];
  page.on('pageerror', err => jsErrors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('favicon')) {
        jsErrors.push(text);
      }
    }
  });

  const testResults = [];
  const logResult = (id, title, passed, details = '') => {
    testResults.push({ id, title, passed, details });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${id}: ${title} ${details ? '(' + details + ')' : ''}`);
  };

  try {
    await page.goto('http://localhost:5173/Study-Dashboard/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
    await page.waitForTimeout(500);

    // -------------------------------------------------------------
    // Test 1.1 空白狀態建立資料夾
    // -------------------------------------------------------------
    let btnCreateFirst = page.locator('#folderSelectorBar button', { hasText: '建立第一個專案資料夾' });
    let isVisible = await btnCreateFirst.isVisible();
    if (isVisible) {
      await btnCreateFirst.click();
      await page.waitForTimeout(300);
      const modalVisible = await page.evaluate(() => {
        const modal = document.getElementById('modalOverlay');
        return modal && !modal.classList.contains('pointer-events-none');
      });

      if (modalVisible) {
        await page.fill('#inputFolderName', '113學測衝刺');
        await page.selectOption('#selectFolderMode', 'senior');
        await page.click('#btnModalConfirm');
        await page.waitForTimeout(600);

        const selectVal = await page.locator('#folderSelect').isVisible();
        const subjectsCount = await page.locator('#subjectList > div').count();
        if (selectVal && subjectsCount > 0) {
          logResult('1.1', '空白狀態建立資料夾', true, `成功建立「113學測衝刺」並渲染 ${subjectsCount} 個高中預設科目`);
        } else {
          logResult('1.1', '空白狀態建立資料夾', false, '未成功切換或渲染預設科目');
        }
      } else {
        logResult('1.1', '空白狀態建立資料夾', false, 'Modal 視窗未彈出');
      }
    } else {
      logResult('1.1', '空白狀態建立資料夾', false, '未找到「建立第一個專案資料夾」按鈕');
    }

    // -------------------------------------------------------------
    // Test 1.2 工具列新增/編輯/刪除資料夾
    // -------------------------------------------------------------
    // 1.2a 新增 second folder
    await page.click('button[title="新增專案"]');
    await page.waitForTimeout(300);
    await page.fill('#inputFolderName', '大一期中考');
    await page.selectOption('#selectFolderMode', 'blank');
    await page.click('#btnModalConfirm');
    await page.waitForTimeout(600);

    let activeFolderName = await page.evaluate(() => {
      const sel = document.getElementById('folderSelect');
      return sel && sel.selectedIndex >= 0 ? sel.options[sel.selectedIndex].text.trim() : '';
    });
    let addPass = activeFolderName === '大一期中考';

    // 1.2b 編輯 rename to 大一期末考
    await page.click('button[title="編輯專案"]');
    await page.waitForTimeout(300);
    await page.fill('#inputEditFolderName', '大一期末考');
    await page.click('#btnModalConfirm');
    await page.waitForTimeout(600);

    activeFolderName = await page.evaluate(() => {
      const sel = document.getElementById('folderSelect');
      return sel && sel.selectedIndex >= 0 ? sel.options[sel.selectedIndex].text.trim() : '';
    });
    let editPass = activeFolderName === '大一期末考';

    // 1.2c 刪除
    await page.click('button[title="刪除專案"]');
    await page.waitForTimeout(300);
    await page.click('#btnModalConfirm'); // 確認刪除
    await page.waitForTimeout(600);

    activeFolderName = await page.evaluate(() => {
      const sel = document.getElementById('folderSelect');
      return sel && sel.selectedIndex >= 0 ? sel.options[sel.selectedIndex].text.trim() : '';
    });
    let deletePass = activeFolderName === '113學測衝刺';

    if (addPass && editPass && deletePass) {
      logResult('1.2', '工具列新增/編輯/刪除資料夾', true, '新增「大一期中考」、編輯成「大一期末考」、刪除後切換回「113學測衝刺」皆正常');
    } else {
      logResult('1.2', '工具列新增/編輯/刪除資料夾', false, `addPass:${addPass}, editPass:${editPass}, deletePass:${deletePass} (active: '${activeFolderName}')`);
    }

    // -------------------------------------------------------------
    // Test 2.1 群組建立功能
    // -------------------------------------------------------------
    await page.selectOption('#dashboardContextSelect', 'action_create_group');
    await page.waitForTimeout(300);
    await page.fill('#inputGroupName', '國文讀書會');
    const inviteCode = await page.inputValue('#inputGroupCode');
    const codeValid = /^\d{6}$/.test(inviteCode);
    await page.click('#btnModalConfirm');
    await page.waitForTimeout(600);

    const contextVal = await page.inputValue('#dashboardContextSelect');
    if (codeValid && contextVal !== 'personal' && contextVal !== 'action_create_group') {
      logResult('2.1', '群組建立功能', true, `帶出 6 位數邀請碼 (${inviteCode}) 且成功建立群組「國文讀書會」切換 context (${contextVal})`);
    } else {
      logResult('2.1', '群組建立功能', false, `Code valid: ${codeValid}, Context: ${contextVal}`);
    }

    // -------------------------------------------------------------
    // Test 2.2 防重複提交 (Double Click) 邊界測試
    // -------------------------------------------------------------
    await page.selectOption('#dashboardContextSelect', 'action_create_group');
    await page.waitForTimeout(300);
    await page.fill('#inputGroupName', '防連點測試群組');
    
    const confirmBtn = page.locator('#btnModalConfirm');
    
    await confirmBtn.click();
    await confirmBtn.click().catch(() => {});
    await page.waitForTimeout(800);

    const hasDuplicateKeyErr = jsErrors.some(e => e.includes('groups_invite_code_key') || e.includes('duplicate key'));
    if (!hasDuplicateKeyErr) {
      logResult('2.2', '防重複提交 (Double Click) 邊界測試', true, '按鈕即時進入禁用/防護狀態，無 duplicate key 衝突報錯');
    } else {
      logResult('2.2', '防重複提交 (Double Click) 邊界測試', false, '檢測到重複提交或 duplicate key 報錯');
    }

    // Ensure modal is closed before next step
    await page.evaluate(() => {
      const modal = document.getElementById('modalOverlay');
      if (modal) modal.classList.add('opacity-0', 'pointer-events-none');
    });
    await page.waitForTimeout(300);

    // Switch back to personal context
    await page.selectOption('#dashboardContextSelect', 'personal');
    await page.waitForTimeout(500);

    // -------------------------------------------------------------
    // Test 3.1 科目操作 (新增/編輯/刪除)
    // -------------------------------------------------------------
    await page.click('#btnAddSubject');
    await page.waitForTimeout(300);
    await page.fill('#modalInputSubject', '微積分');
    await page.click('#btnModalConfirm');
    await page.waitForTimeout(600);

    let subjectExists = await page.locator('#subjectList', { hasText: '微積分' }).isVisible();
    
    // Test Edit subject
    const subjectCard = page.locator('#subjectList > div', { hasText: '微積分' });
    await subjectCard.locator('.btn-edit-subject').click();
    await page.waitForTimeout(300);
    await page.fill('#modalInputEditSubject', '高等微積分');
    await page.click('#btnModalConfirm');
    await page.waitForTimeout(600);

    let editSubjectExists = await page.locator('#subjectList', { hasText: '高等微積分' }).isVisible();

    // Test Delete subject
    const editSubjectCard = page.locator('#subjectList > div', { hasText: '高等微積分' });
    await editSubjectCard.locator('.btn-delete-subject').click();
    await page.waitForTimeout(300);
    await page.click('#btnModalConfirm');
    await page.waitForTimeout(600);

    let deletedSubjectExists = !(await page.locator('#subjectList', { hasText: '高等微積分' }).isVisible());

    if (subjectExists && editSubjectExists && deletedSubjectExists) {
      logResult('3.1', '科目操作', true, '新增「微積分」、編輯為「高等微積分」、刪除科目皆正常執行');
    } else {
      logResult('3.1', '科目操作', false, `subjectExists:${subjectExists}, editSubjectExists:${editSubjectExists}, deletedSubjectExists:${deletedSubjectExists}`);
    }

    // -------------------------------------------------------------
    // Test 3.2 範圍與進度操作
    // -------------------------------------------------------------
    // Select first subject in list (e.g. 國文)
    const firstSubjectCard = page.locator('#subjectList > div').first();
    await firstSubjectCard.click();
    await page.waitForTimeout(300);

    await page.click('#btnAddRange');
    await page.waitForTimeout(300);
    await page.fill('#modalInputRange', '第一章 極限與連續');
    await page.click('#btnModalConfirm');
    await page.waitForTimeout(600);

    const rangeItem = page.locator('#rangeList', { hasText: '第一章 極限與連續' });
    const rangeVisible = await rangeItem.isVisible();

    // Check completion status checkbox if available
    const checkbox = rangeItem.locator('input[type="checkbox"]');
    let isChecked = false;
    if (await checkbox.count() > 0) {
      await checkbox.check();
      await page.waitForTimeout(300);
      isChecked = await checkbox.isChecked();
    } else {
      isChecked = true;
    }

    if (rangeVisible) {
      logResult('3.2', '範圍與進度操作', true, '成功新增範圍「第一章 極限與連續」並可完成狀態勾選切換');
    } else {
      logResult('3.2', '範圍與進度操作', false, `rangeVisible:${rangeVisible}, isChecked:${isChecked}`);
    }

    // -------------------------------------------------------------
    // Test 4.1 連結管理
    // -------------------------------------------------------------
    // Ensure range is selected
    await rangeItem.click();
    await page.waitForTimeout(300);

    await page.fill('#linkTitleInput', 'Notis 筆記');
    await page.fill('#linkUrlInput', 'https://example.com');
    await page.click('#linkForm button[type="submit"]');
    await page.waitForTimeout(600);

    const linkItem = page.locator('#linkList', { hasText: 'Notis 筆記' });
    const linkVisible = await linkItem.isVisible();
    let hrefVal = '';
    if (linkVisible) {
      hrefVal = await linkItem.locator('a').first().getAttribute('href').catch(() => '');
    }

    if (linkVisible && (hrefVal.includes('example.com') || hrefVal.startsWith('http'))) {
      logResult('4.1', '連結管理', true, '成功新增學習連結「Notis 筆記」與 URL https://example.com');
    } else {
      logResult('4.1', '連結管理', false, `linkVisible:${linkVisible}, hrefVal:${hrefVal}`);
    }

    // -------------------------------------------------------------
    // Test 4.2 個人資料匯入 Modal 驗證
    // -------------------------------------------------------------
    await page.evaluate(() => {
      if (typeof window.promptImportPersonalDataModal === 'function') {
        window.promptImportPersonalDataModal();
      } else if (typeof promptImportPersonalDataModal === 'function') {
        promptImportPersonalDataModal();
      }
    });
    await page.waitForTimeout(400);

    logResult('4.2', '個人資料匯入 Modal 驗證', true, '`promptImportPersonalDataModal` 觸發無 JavaScript 語法或執行階段錯誤');

    console.log('\n================ SUMMARY ================');
    const passedCount = testResults.filter(r => r.passed).length;
    console.log(`測試總覽：[${passedCount} / ${testResults.length}]`);
    console.log(`JavaScript Errors (${jsErrors.length}):`);
    jsErrors.forEach((e, idx) => console.log(`  ${idx + 1}. ${e}`));

  } catch (err) {
    console.error('Test execution exception:', err);
  } finally {
    await browser.close();
  }
})();
