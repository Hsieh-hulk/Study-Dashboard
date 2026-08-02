import './styles.css';

    // Storage Keys

    const STORAGE_KEY = 'study_agent_db_v5';

    function sortItems(items, type) {
      if (!Array.isArray(items)) return items ? items.slice() : [];
      return [...items].sort((a, b) => {
        const valA = a.created_at || a.createdAt || '';
        const valB = b.created_at || b.createdAt || '';
        const timeA = valA ? new Date(valA).getTime() : 0;
        const timeB = valB ? new Date(valB).getTime() : 0;
        return timeA - timeB; // ascending
      });
    }

    const THEME_KEY = 'happyhues_theme_setting';
    const SUPABASE_CONFIG_KEY = 'study_dashboard_supabase_cfg';

    const DEFAULT_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://svupitaqiblqgvfbzblm.supabase.co';

    const DEFAULT_SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2dXBpdGFxaWJscWd2ZmJ6YmxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyMzQyNzYsImV4cCI6MjEwMDgxMDI3Nn0.DgliAnfFAZYcBGsHP5D_OYqrxgAzWoSyj9ncKc3rod4';



    // Seed Initial Sample Data & Preset Education Modes

    const PRESET_MODES = {

      junior: {

        id: 'junior',

        name: '國中模式',

        badge: '🎒 國中模式',

        subjects: [

          { id: 'sub_chi_01', name: '國文 📖', preset_mode: 'junior', ranges: [] },

          { id: 'sub_eng_02', name: '英文 🔤', preset_mode: 'junior', ranges: [] },

          { id: 'sub_math_03', name: '數學 📐', preset_mode: 'junior', ranges: [] },

          { id: 'sub_bio_09', name: '生物 🧬', preset_mode: 'junior', ranges: [] },

          { id: 'sub_phy_07', name: '物理 ⚡', preset_mode: 'junior', ranges: [] },

          { id: 'sub_chem_08', name: '化學 🧪', preset_mode: 'junior', ranges: [] },

          { id: 'sub_earth_10', name: '地科 🌍', preset_mode: 'junior', ranges: [] },

          { id: 'sub_his_04', name: '歷史 📜', preset_mode: 'junior', ranges: [] },

          { id: 'sub_geo_05', name: '地理 🗺️', preset_mode: 'junior', ranges: [] },

          { id: 'sub_civ_06', name: '公民 ⚖️', preset_mode: 'junior', ranges: [] }

        ]

      },

      senior: {

        id: 'senior',

        name: '高中模式',

        badge: '🏫 高中模式',

        subjects: [

          { id: 'sub_chi_01', name: '國文 📖', preset_mode: 'senior', ranges: [] },

          { id: 'sub_eng_02', name: '英文 🔤', preset_mode: 'senior', ranges: [] },

          { id: 'sub_math_03', name: '數學 📐', preset_mode: 'senior', ranges: [] },

          { id: 'sub_bio_09', name: '生物 🧬', preset_mode: 'senior', ranges: [] },

          { id: 'sub_phy_07', name: '物理 ⚡', preset_mode: 'senior', ranges: [] },

          { id: 'sub_chem_08', name: '化學 🧪', preset_mode: 'senior', ranges: [] },

          { id: 'sub_earth_10', name: '地科 🌍', preset_mode: 'senior', ranges: [] },

          { id: 'sub_his_04', name: '歷史 📜', preset_mode: 'senior', ranges: [] },

          { id: 'sub_geo_05', name: '地理 🗺️', preset_mode: 'senior', ranges: [] },

          { id: 'sub_civ_06', name: '公民 ⚖️', preset_mode: 'senior', ranges: [] }

        ]

      },

      vocational: {

        id: 'vocational',

        name: '高職模式',

        badge: '🛠️ 高職模式',

        subjects: [

          { id: 'sub_chi_01', name: '國文 📖', preset_mode: 'vocational', ranges: [] },

          { id: 'sub_eng_02', name: '英文 🔤', preset_mode: 'vocational', ranges: [] },

          { id: 'sub_math_03', name: '數學 📐', preset_mode: 'vocational', ranges: [] },

          { id: 'sub_spec1_04', name: '專一 ⚙️', preset_mode: 'vocational', ranges: [] },

          { id: 'sub_spec2_05', name: '專二 💻', preset_mode: 'vocational', ranges: [] }

        ]

      },

      university: {

        id: 'university',

        name: '大學模式',

        badge: '🎓 大學模式',

        subjects: []

      },

      blank: {

        id: 'blank',

        name: '空白模式',

        badge: '📄 空白模式',

        subjects: []

      }

    };



    // State Management (Pub/Sub + Deep Proxy)
    class ReactiveStore {
      constructor(initialState) {
        this.listeners = {};
        this.state = this._createProxy(initialState, []);
      }

      _createProxy(target, path) {
        const self = this;
        if (typeof target !== 'object' || target === null) return target;

        return new Proxy(target, {
          get(obj, prop) {
            const val = Reflect.get(obj, prop);
            // Array methods need to be bound to the original array to work correctly,
            // but we want mutations to trigger our set trap. 
            // Wait, standard Proxy on Arrays handles .push by triggering set on indexes and length.
            // We just need to proxy the returned object.
            if (typeof val === 'object' && val !== null) {
              return self._createProxy(val, [...path, prop]);
            }
            if (typeof val === 'function' && Array.isArray(obj)) {
               return function(...args) {
                   const result = Array.prototype[prop].apply(obj, args);
                   const rootProp = path.length > 0 ? path[0] : prop;
                   self.notify(rootProp, self.state[rootProp]);
                   return result;
               }
            }
            return val;
          },
          set(obj, prop, value) {
            const oldValue = obj[prop];
            const result = Reflect.set(obj, prop, value);
            if (oldValue !== value) {
               // Notify the root property that changed
               const rootProp = path.length > 0 ? path[0] : prop;
               self.notify(rootProp, self.state[rootProp]);
            }
            return result;
          },
          deleteProperty(obj, prop) {
            const result = Reflect.deleteProperty(obj, prop);
            const rootProp = path.length > 0 ? path[0] : prop;
            self.notify(rootProp, self.state[rootProp]);
            return result;
          }
        });
      }

      subscribe(prop, callback) {
        if (!this.listeners[prop]) this.listeners[prop] = [];
        this.listeners[prop].push(callback);
      }

      notify(prop, value) {
        if (this.listeners[prop]) {
          this.listeners[prop].forEach(cb => cb(value));
        }
      }
    }

    const globalStore = new ReactiveStore({
      // Core App State
      folders: [],
      activeFolderId: null,
      subjects: [],
      activeSubjectId: null,
      activeRangeId: null,

      // Context & User
      currentDashboardContext: 'personal',
      currentUser: null,
      myGroups: [],
      pendingJoinRequests: [],

      // UI State
      currentMobileTab: 'nav',
      currentSearchResults: []
    });

    // Provide legacy `state` reference to ease migration, but everything should use globalStore.state
    let state = globalStore.state;

    // Subscriptions
    globalStore.subscribe('currentUser', renderAuthPill);
    globalStore.subscribe('myGroups', renderDashboardContextOptions);
    globalStore.subscribe('currentDashboardContext', () => {
      renderDashboardContextOptions();
      renderAll();
    });
    globalStore.subscribe('folders', renderFolderBar);
    globalStore.subscribe('activeFolderId', renderFolderBar);
    globalStore.subscribe('subjects', () => {
      renderSubjects();
      renderRanges();
      renderPresetModeBadge();
    });
    globalStore.subscribe('activeSubjectId', () => {
      renderSubjects();
      renderRanges();
    });
    globalStore.subscribe('activeRangeId', renderLinks);
    globalStore.subscribe('currentSearchResults', (results) => {
      const searchInput = document.getElementById('globalSearchInput');
      if (searchInput) {
        renderSearchResults(results, searchInput.value || '');
      }
    });






    // Supabase Client & Realtime Handles

    let supabaseClient = null;

    let realtimeChannel = null;



    // --- Supabase Client & Cloud Sync Engine ---

    function cleanUrlOAuthParams() {
      if (window.location.hash || window.location.search) {
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState(null, '', cleanUrl);
      }
    }

    function initSupabase() {
      try {
        let url = DEFAULT_SUPABASE_URL;
        let key = DEFAULT_SUPABASE_KEY;

        if (url && key && typeof supabase !== 'undefined') {
      url = url.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
      supabaseClient = supabase.createClient(url, key);
      checkSupabaseSession();

      supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          checkSupabaseSession();
        } else if (event === 'SIGNED_OUT') {
          cleanUrlOAuthParams();
          globalStore.state.currentUser = null;
          globalStore.state.myGroups = [];
          globalStore.state.currentDashboardContext = 'personal';
          renderAuthPill();
          renderDashboardContextOptions();
          loadState();
          renderAll();
        }
      });
      return;
    }
  } catch (err) {
    console.warn('Supabase config not set or invalid:', err);
  }
  renderAuthPill();
}

async function checkSupabaseSession() {
  if (!supabaseClient) {
    loadState();
    renderAll();
    return;
  }

  try {
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (session && session.user) {
      cleanUrlOAuthParams();
      await loadUserProfile(session.user);
      await loadUserGroups();
      await loadDashboardData();
      setupRealtimeSubscription();
    } else {
      globalStore.state.currentUser = null;
      loadState();
      renderAll();
    }
  } catch (err) {
    console.error('Failed to get session', err);
    loadState();
    renderAll();
  }

  renderAuthPill();
}



    async function loadDashboardData() {

      if (!supabaseClient || !globalStore.state.currentUser) {

        loadState();

        renderAll();

        return;

      }



      function showSkeletonLoading() {
        const subjectList = document.getElementById('subjectList');
        const rangesContainer = document.getElementById('rangesContainer');
        const linksContainer = document.getElementById('linksContainer');
        const skeletonHtml = `
          <div class="skeleton-box w-full h-14 mb-3"></div>
          <div class="skeleton-box w-full h-14 mb-3"></div>
          <div class="skeleton-box w-full h-14 mb-3"></div>
        `;
        if (subjectList) subjectList.innerHTML = skeletonHtml;
        if (rangesContainer) rangesContainer.innerHTML = skeletonHtml;
        if (linksContainer) linksContainer.innerHTML = skeletonHtml;
      }

      showSkeletonLoading();

      try {

        let query = supabaseClient.from('subjects').select('*, ranges(*, resource_links(*, creator:profiles!resource_links_created_by_fkey(nickname, avatar_url), editor:profiles!fk_resource_links_last_editor(nickname, avatar_url)))');



        if (globalStore.state.currentDashboardContext === 'personal') {

          const activeFolder = getActiveFolder();

          if (!activeFolder) {

            state.folders = [];

            renderAll();

            return;

          }

          query = query.eq('user_id', globalStore.state.currentUser.id).is('group_id', null).eq('preset_mode', activeFolder.id);

        } else {

          query = query.eq('group_id', globalStore.state.currentDashboardContext);

        }



        let { data, error } = await query;

        if (error) throw error;



        if (globalStore.state.currentDashboardContext !== 'personal') {

          if (!state.groupFolders) state.groupFolders = {};

          if (!state.groupFolders[globalStore.state.currentDashboardContext]) {

            state.groupFolders[globalStore.state.currentDashboardContext] = { folders: [], activeFolderId: null };

          }



          let parsedFoldersMap = new Map();

          let parsedSubjects = [];



          // Parse folders from meta subjects or infer from normal subjects

          (data || []).forEach(sub => {

            if (sub.name === '___FOLDER_META___') {

              const parts = (sub.preset_mode || '').split('|');

              if (parts.length >= 3) {

                const fId = parts[0];

                const fName = parts[1];

                const fMode = parts[2];

                if (!parsedFoldersMap.has(fId)) {

                  parsedFoldersMap.set(fId, { id: fId, name: fName, preset_mode: fMode, subjects: [] });

                }

              }

            } else {

              parsedSubjects.push(sub);

            }

          });



          // Re-construct loaded subjects

          const loadedSubs = parsedSubjects.map(sub => ({

            id: sub.id,

            name: sub.name,

            user_id: sub.user_id,

            group_id: sub.group_id,

            preset_mode: sub.preset_mode,

            created_at: sub.created_at,

            ranges: (sub.ranges || []).map(rng => ({

              id: rng.id, name: rng.name, subject_id: rng.subject_id, created_at: rng.created_at,

              links: (rng.resource_links || []).map(lnk => ({

                id: lnk.id, title: lnk.title, url: lnk.url, range_id: lnk.range_id, created_by: lnk.created_by,

                created_at: lnk.created_at,

                last_edited_by: lnk.last_edited_by, last_edited_at: lnk.last_edited_at, editor: lnk.editor || null, creator: lnk.creator || null

              }))

            }))

          }));



          // Assign subjects to folders based on preset_mode (which stores folder id)

          loadedSubs.forEach(sub => {

            const fId = sub.preset_mode;

            if (fId) {

              if (!parsedFoldersMap.has(fId)) {

                // Infer folder if meta was missing for some reason

                parsedFoldersMap.set(fId, { id: fId, name: '未命名專案', preset_mode: 'blank', subjects: [] });

              }

              parsedFoldersMap.get(fId).subjects.push(sub);

            }

          });



          // Restore local active folder id if valid

          let newFolders = Array.from(parsedFoldersMap.values());

          const oldActiveId = state.groupFolders[globalStore.state.currentDashboardContext].activeFolderId;



          state.groupFolders[globalStore.state.currentDashboardContext].folders = newFolders;

          if (newFolders.length > 0 && (!oldActiveId || !newFolders.find(f => f.id === oldActiveId))) {

            state.groupFolders[globalStore.state.currentDashboardContext].activeFolderId = newFolders[0].id;

          }

          state.subjects = []; // Group mode subjects now live in the folder

        } else {

          // Personal Mode processing

          if (data && data.length > 0) {

            const loadedSubs = data.map(sub => ({

              id: sub.id, name: sub.name, user_id: sub.user_id, group_id: sub.group_id, preset_mode: sub.preset_mode,

              created_at: sub.created_at,

              ranges: (sub.ranges || []).map(rng => ({

                id: rng.id, name: rng.name, subject_id: rng.subject_id, created_at: rng.created_at,

                links: (rng.resource_links || []).map(lnk => ({

                  id: lnk.id, title: lnk.title, url: lnk.url, range_id: lnk.range_id, created_by: lnk.created_by,

                  created_at: lnk.created_at,

                  last_edited_by: lnk.last_edited_by, last_edited_at: lnk.last_edited_at, editor: lnk.editor || null, creator: lnk.creator || null

                }))

              }))

            }));

            const activeFolder = getActiveFolder();

            if (activeFolder) activeFolder.subjects = loadedSubs;

          } else {

            const activeFolder = getActiveFolder();

            if (activeFolder && activeFolder.subjects.length === 0) {

              const presetObj = PRESET_MODES[activeFolder.preset_mode];

              if (presetObj && presetObj.subjects && presetObj.subjects.length > 0) {

                syncFolderSubjectsToCloud(activeFolder);

              }

            }

          }

        }



        validateStateDefensive();

        renderAll();

      } catch (err) {

        console.error('Failed to load dashboard data from Supabase:', err);

        showToast('雲端資料讀取失敗，使用本機暫存資料', 'danger');

        loadState();

        renderAll();

      }

    }



    async function syncFolderSubjectsToCloud(folder, isUpdateMetaOnly = false) {

      if (!supabaseClient || !globalStore.state.currentUser) return;



      const isPersonal = globalStore.state.currentDashboardContext === 'personal';

      const gId = isPersonal ? null : globalStore.state.currentDashboardContext;

      const uId = isPersonal ? globalStore.state.currentUser.id : null;



      let seedPayload = [];

      const metaMode = `${folder.id}|${folder.name}|${folder.preset_mode}`;



      // Add meta subject

      seedPayload.push({

        name: '___FOLDER_META___',

        user_id: uId,

        group_id: gId,

        preset_mode: metaMode

      });



      const localSubjects = folder.subjects.filter(s => typeof s.id === 'string' && s.id.startsWith('sub_'));

      const presetObj = PRESET_MODES[folder.preset_mode];



      if (!isUpdateMetaOnly) {

        if (localSubjects.length > 0) {

          localSubjects.forEach(s => {

            seedPayload.push({ name: s.name, user_id: uId, group_id: gId, preset_mode: folder.id });

          });

        } else if (folder.subjects.length === 0 && presetObj && presetObj.subjects) {

          presetObj.subjects.forEach(s => {

            seedPayload.push({ name: s.name, user_id: uId, group_id: gId, preset_mode: folder.id });

          });

        }

      }



      try {

        if (isUpdateMetaOnly) {

          let delQ = supabaseClient.from('subjects').delete().eq('name', '___FOLDER_META___').like('preset_mode', `${folder.id}|%`);

          if (isPersonal) delQ = delQ.eq('user_id', globalStore.state.currentUser.id).is('group_id', null);

          else delQ = delQ.eq('group_id', gId);

          await delQ;

        }



        const { data: inserted, error: seedErr } = await supabaseClient.from('subjects').insert(seedPayload).select();

        if (seedErr) throw seedErr;



        if (inserted && !isUpdateMetaOnly) {

          const insertedNormal = inserted.filter(s => s.name !== '___FOLDER_META___');

          if (localSubjects.length > 0) {

            insertedNormal.forEach((dbSub, idx) => {

              if (localSubjects[idx]) localSubjects[idx].id = dbSub.id;

            });

          } else {

            folder.subjects = insertedNormal.map(s => ({

              id: s.id, name: s.name, user_id: s.user_id, group_id: s.group_id, preset_mode: folder.id, ranges: []

            }));

          }

          saveState();

          if (getContextActiveFolderId() === folder.id) renderAll();

        }

      } catch (err) {

        console.error('Background sync failed:', err);

        showToast('本機已儲存，雲端將於下次連線時同步', 'warning');

      }

    }



    function setupRealtimeSubscription() {

      if (!supabaseClient) return;



      if (realtimeChannel) {

        supabaseClient.removeChannel(realtimeChannel);

        realtimeChannel = null;

      }



      const chanName = `rt_ctx_${globalStore.state.currentDashboardContext}_${Date.now()}`;

      realtimeChannel = supabaseClient.channel(chanName)

        .on('postgres_changes', { event: '*', schema: 'public', table: 'subjects' }, () => loadDashboardData())

        .on('postgres_changes', { event: '*', schema: 'public', table: 'ranges' }, () => loadDashboardData())

        .on('postgres_changes', { event: '*', schema: 'public', table: 'resource_links' }, () => loadDashboardData())

        .on('postgres_changes', { event: '*', schema: 'public', table: 'group_join_requests' }, () => loadUserGroups())

        .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members' }, () => loadUserGroups())

        .subscribe();

    }



    async function loadUserProfile(authUser) {

      if (!supabaseClient) return;

      try {

        let { data: profile, error } = await supabaseClient

          .from('profiles')

          .select('*')

          .eq('id', authUser.id)

          .single();



        if (error || !profile) {

          // Create default profile from authUser meta

          const nickname = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || '學習者';

          const avatarUrl = authUser.user_metadata?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + authUser.id;



          const newProfile = {

            id: authUser.id,

            email: authUser.email,

            nickname: nickname,

            avatar_url: avatarUrl

          };



          await supabaseClient.from('profiles').upsert(newProfile);



          let finalAvatarUrl = avatarUrl;

          if (finalAvatarUrl.includes('#local')) {

            const local = localStorage.getItem(`local_avatar_${authUser.id}`);

            if (local) finalAvatarUrl = local;

          }

          globalStore.state.currentUser = { id: authUser.id, email: authUser.email, nickname, avatarUrl: finalAvatarUrl };

          promptProfileSetupModal(true); // Prompt onboarding

        } else {

          if (profile.current_preset_mode) {

            state.currentPresetMode = profile.current_preset_mode;

          }



          let finalAvatarUrl = profile.avatar_url || ('https://api.dicebear.com/7.x/bottts/svg?seed=' + profile.id);

          if (finalAvatarUrl.includes('#local')) {

            const local = localStorage.getItem(`local_avatar_${profile.id}`);

            if (local) finalAvatarUrl = local;

          }



          globalStore.state.currentUser = {

            id: profile.id,

            email: profile.email || authUser.email,

            nickname: profile.nickname || '學習者',

            avatarUrl: finalAvatarUrl

          };

        }

      } catch (err) {

        console.error('Error loading profile', err);

      }

    }



    async function loadUserGroups() {

      if (!supabaseClient || !globalStore.state.currentUser) return;

      try {

        // Fetch groups where user is a member

        const { data: memberships } = await supabaseClient

          .from('group_members')

          .select('group_id, role, groups(*)')

          .eq('user_id', globalStore.state.currentUser.id);



        if (memberships) {

          globalStore.state.myGroups = memberships.map(m => m.groups).filter(Boolean);

        } else {

          globalStore.state.myGroups = [];

        }



        // Fetch pending requests for groups owned by user

        const ownedGroupIds = globalStore.state.myGroups.filter(g => g.owner_id === globalStore.state.currentUser.id).map(g => g.id);

        if (ownedGroupIds.length > 0) {

          const { data: reqs } = await supabaseClient

            .from('group_join_requests')

            .select('*, profiles(*), groups(*)')

            .in('group_id', ownedGroupIds)

            .eq('status', 'pending');

          globalStore.state.pendingJoinRequests = reqs || [];

        } else {

          globalStore.state.pendingJoinRequests = [];

        }



        renderDashboardContextOptions();

      } catch (err) {

        console.error('Failed loading groups', err);

      }

    }



    async function handleGoogleLogin() {
      if (!supabaseClient) {
        showToast('Supabase 連線失敗，請確認 .env 環境變數', 'danger');
        return;
      }

      // 確保 redirectTo 乾淨，不包含舊的 OAuth Hash (#access_token=...) 或 Search 參數
      const redirectUrl = window.location.origin + window.location.pathname;

      try {
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: redirectUrl }
        });

        if (error) {
          showToast('Google 登入連線失敗: ' + error.message, 'danger');
        }
      } catch (err) {
        showToast('Google 登入發生異常: ' + err.message, 'danger');
      }
    }

    async function handleLogout() {
      if (supabaseClient) {
        try {
          await supabaseClient.auth.signOut();
        } catch (err) {
          console.warn('SignOut error:', err);
        }
      }

      cleanUrlOAuthParams();

      globalStore.state.currentUser = null;
      globalStore.state.myGroups = [];
      globalStore.state.currentDashboardContext = 'personal';

      renderAuthPill();
      renderDashboardContextOptions();
      loadState();
      renderAll();

      showToast('已安全登出', 'info');
    }



    // --- Core Data Initialization & Persistence ---



    function loadState() {

      try {

        let raw = localStorage.getItem(STORAGE_KEY);



        // 從舊版 v4 遷移：若 v5 不存在，檢查 v4 但自動濾除舊版產生的「預設專案資料夾」

        if (!raw) {

          const oldRaw = localStorage.getItem('study_agent_db_v4');

          if (oldRaw) {

            try {

              const oldState = JSON.parse(oldRaw);

              if (oldState && Array.isArray(oldState.folders)) {

                const userFolders = oldState.folders.filter(f => f.name !== '預設專案資料夾');

                if (userFolders.length > 0) {

                  state.folders = userFolders;

                  state.activeFolderId = oldState.activeFolderId && userFolders.some(f => f.id === oldState.activeFolderId)

                    ? oldState.activeFolderId

                    : userFolders[0].id;

                }

              }

            } catch (e) {

              console.warn('Failed to migrate from v4 state', e);

            }

          }

        }



        if (!raw && state.folders.length === 0) {

          state = {

            folders: [],

            activeFolderId: null,

            subjects: [],

            activeSubjectId: null,

            activeRangeId: null

          };

          saveState();

        } else if (raw) {

          state = JSON.parse(raw);

          if (!state.folders) state.folders = [];

          if (!state.subjects) state.subjects = [];



          validateStateDefensive();

          saveState();

        }

      } catch (err) {

        console.error('Failed to parse state from localStorage', err);

        state = {

          folders: [],

          activeFolderId: null,

          subjects: [],

          activeSubjectId: null,

          activeRangeId: null

        };

        saveState();

      }



      // Load Theme (Default to 'sage' eye-care reading mode)
      const savedTheme = localStorage.getItem(THEME_KEY) || 'sage';
      const validThemes = ['sage', 'dusk', 'light'];
      if (!validThemes.includes(savedTheme)) {
        setTheme('sage');
        document.getElementById('themeSelector').value = 'sage';
      } else {
        setTheme(savedTheme);
        document.getElementById('themeSelector').value = savedTheme;
      }
    }



    function saveState() {

      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    }



    function setTheme(themeName) {

      document.documentElement.setAttribute('data-theme', themeName);

      localStorage.setItem(THEME_KEY, themeName);

    }



    function getActiveFolder() {

      const contextFolders = getContextFolders();

      const activeId = getContextActiveFolderId();

      return contextFolders.find(f => f.id === activeId) || null;

    }



    function getFilteredSubjects() {

      const activeFolder = getActiveFolder();

      return activeFolder ? (activeFolder.subjects || []) : [];

    }



    function validateStateDefensive() {

      const visibleSubjects = getFilteredSubjects();

      const currSub = visibleSubjects.find(s => s.id === state.activeSubjectId);

      if (!currSub) {

        state.activeSubjectId = visibleSubjects.length > 0 ? visibleSubjects[0].id : null;

      }



      const activeSubObj = visibleSubjects.find(s => s.id === state.activeSubjectId);

      if (activeSubObj && activeSubObj.ranges) {

        const currRng = activeSubObj.ranges.find(r => r.id === state.activeRangeId);

        if (!currRng) {

          state.activeRangeId = activeSubObj.ranges.length > 0 ? activeSubObj.ranges[0].id : null;

        }

      } else {

        state.activeRangeId = null;

      }

    }



    // --- Helper Functions ---



    function generateId(prefix = 'id') {

      if (typeof crypto !== 'undefined' && crypto.randomUUID) {

        return `${prefix}_${crypto.randomUUID().substr(0, 8)}`;

      }

      return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    }



    function generateNumericInviteCode() {

      return Math.floor(100000 + Math.random() * 900000).toString();

    }



    function normalizeUrl(url) {

      let trimmed = url.trim();

      if (!/^https?:\/\//i.test(trimmed)) {

        trimmed = 'https://' + trimmed;

      }

      return trimmed;

    }



    function getActiveSubject() {

      const visibleSubjects = getFilteredSubjects();

      return visibleSubjects.find(s => s.id === state.activeSubjectId) || null;

    }



    function getActiveRange() {

      const sub = getActiveSubject();

      if (!sub || !sub.ranges) return null;

      return sub.ranges.find(r => r.id === state.activeRangeId) || null;

    }



    // --- UI Renderers for Auth & Dashboard Switcher ---



    function renderAuthPill() {

      const container = document.getElementById('authPillContainer');

      if (!container) return;



      if (!globalStore.state.currentUser) {

        container.innerHTML = `

          <button id="btnLogin" class="hh-btn-primary px-3 py-1.5 text-xs flex items-center gap-1.5">

            <i data-lucide="log-in" class="w-4 h-4"></i>

            <span>Google 登入</span>

          </button>

        `;

        document.getElementById('btnLogin').onclick = handleGoogleLogin;

      } else {

        const notificationDot = globalStore.state.pendingJoinRequests.length > 0

          ? `<span class="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping absolute -top-0.5 -right-0.5"></span><span class="w-2.5 h-2.5 bg-rose-500 rounded-full absolute -top-0.5 -right-0.5"></span>`

          : '';



        container.innerHTML = `

          <div class="relative group">

            <button id="btnProfileMenu" class="hh-btn-secondary px-2.5 py-1 text-xs flex items-center gap-2 relative">

              <img src="${escapeHtml(globalStore.state.currentUser.avatarUrl)}" alt="Avatar" class="w-6 h-6 rounded-full border border-(--hh-card-border) object-cover">

              <span class="font-extrabold max-w-[90px] truncate hidden sm:inline">${escapeHtml(globalStore.state.currentUser.nickname)}</span>

              ${notificationDot}

              <i data-lucide="chevron-down" class="w-3.5 h-3.5 opacity-70"></i>

            </button>

            <div class="hidden group-hover:block absolute right-0 top-full pt-1.5 w-48 z-50 animate-pop-in">

              <div class="hh-card bg-(--hh-card) p-2 shadow-xl border-2 space-y-1 text-xs font-bold">

                <button id="menuEditProfile" class="w-full text-left px-3 py-2 rounded-lg hover:bg-(--hh-accent-ice) flex items-center gap-2">

                  <i data-lucide="user-cog" class="w-4 h-4"></i>

                  <span>編輯個人資料</span>

                </button>

                <button id="menuManageGroups" class="w-full text-left px-3 py-2 rounded-lg hover:bg-(--hh-accent-ice) flex items-center gap-2">

                  <i data-lucide="users" class="w-4 h-4"></i>

                  <span>群組管理與審核</span>

                  ${globalStore.state.pendingJoinRequests.length > 0 ? `<span class="ml-auto px-1.5 py-0.5 text-[9px] bg-rose-500 text-white rounded-full font-black">${globalStore.state.pendingJoinRequests.length}</span>` : ''}

                </button>

                <button id="menuPresetModes" class="w-full text-left px-3 py-2 rounded-lg hover:bg-(--hh-accent-ice) flex items-center gap-2">

                  <i data-lucide="graduation-cap" class="w-4 h-4"></i>

                  <span>預設學習模式</span>

                </button>

                <div class="border-t border-(--hh-card-border) my-1"></div>

                <button id="menuLogout" class="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-50 text-rose-600 flex items-center gap-2">

                  <i data-lucide="log-out" class="w-4 h-4"></i>

                  <span>登出系統</span>

                </button>

              </div>

            </div>

          </div>

        `;



        document.getElementById('menuEditProfile').onclick = () => promptProfileSetupModal(false);

        document.getElementById('menuManageGroups').onclick = promptManageGroupsModal;

        document.getElementById('menuPresetModes').onclick = () => promptPresetModeModal(false);

        document.getElementById('menuLogout').onclick = handleLogout;

      }

      lucide.createIcons({ props: { searchTarget: container } });

    }



    function renderDashboardContextOptions() {

      const select = document.getElementById('dashboardContextSelect');

      const optGroup = document.getElementById('groupOptGroup');

      if (!optGroup) return;



      optGroup.innerHTML = '';



      if (globalStore.state.myGroups.length === 0) {

        const option = document.createElement('option');

        option.disabled = true;

        option.textContent = '尚未加入任何群組';

        optGroup.appendChild(option);

      } else {

        globalStore.state.myGroups.forEach(g => {

          const option = document.createElement('option');

          option.value = g.id;

          option.textContent = `👥 ${g.name} (${g.invite_code})`;

          optGroup.appendChild(option);

        });

      }



      select.value = globalStore.state.currentDashboardContext;

    }



    async function switchDashboardContext(contextId = 'personal') {

      globalStore.state.currentDashboardContext = contextId;

      renderDashboardContextOptions();

      await loadUserGroups();

      await loadDashboardData();

      setupRealtimeSubscription();

    }



    // --- Modals for Preset Modes, Profile, Groups & Supabase Config ---



    function promptPresetModeModal(isInitial = false) {

      const currentMode = state.currentPresetMode || 'senior';



      openModal({

        title: isInitial ? '歡迎！請選擇您的預設學習階段' : '選擇／切換預設學制模式',

        icon: 'graduation-cap',

        contentHtml: `

          <div class="space-y-4">

            <p class="text-xs text-(--hh-paragraph) font-bold leading-relaxed">

              ${isInitial

            ? '系統將根據您選擇的學習階段，為您建立對應的獨立預設科目看板：'

            : '請選擇欲切換的學制模式。<br><span class="text-emerald-600 font-black">✨ 多學制獨立隔離：切換模式將顯示該學制專屬看板，原本學制的科目與單元進度將完整保留，可隨時切換還原。</span>'}

            </p>



            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3" id="presetModeOptions">

              <label class="preset-mode-card group">

                <div class="flex items-center gap-2 mb-1">

                  <input type="radio" name="presetModeRadio" value="junior" ${currentMode === 'junior' ? 'checked' : ''} class="preset-radio-dot">

                  <span class="font-extrabold text-xs hh-headline">🎒 國中模式</span>

                </div>

                <p class="text-[10px] text-(--hh-paragraph) opacity-80 leading-tight font-medium">國、英、數、物、理化、生、地科、歷、地、公民 (10科)</p>

              </label>



              <label class="preset-mode-card group">

                <div class="flex items-center gap-2 mb-1">

                  <input type="radio" name="presetModeRadio" value="senior" ${currentMode === 'senior' ? 'checked' : ''} class="preset-radio-dot">

                  <span class="font-extrabold text-xs hh-headline">🏫 高中模式</span>

                </div>

                <p class="text-[10px] text-(--hh-paragraph) opacity-80 leading-tight font-medium">國、英、數、物、化、生、地科、歷、地、公民 (10科)</p>

              </label>



              <label class="preset-mode-card group">

                <div class="flex items-center gap-2 mb-1">

                  <input type="radio" name="presetModeRadio" value="vocational" ${currentMode === 'vocational' ? 'checked' : ''} class="preset-radio-dot">

                  <span class="font-extrabold text-xs hh-headline">🛠️ 高職模式</span>

                </div>

                <p class="text-[10px] text-(--hh-paragraph) opacity-80 leading-tight font-medium">國文、英文、數學、專一、專二 (5科)</p>

              </label>



              <label class="preset-mode-card group">

                <div class="flex items-center gap-2 mb-1">

                  <input type="radio" name="presetModeRadio" value="university" ${currentMode === 'university' ? 'checked' : ''} class="preset-radio-dot">

                  <span class="font-extrabold text-xs hh-headline">🎓 大學模式</span>

                </div>

                <p class="text-[10px] text-(--hh-paragraph) opacity-80 leading-tight font-medium">預設空白，可自由手動新增專業科系科目</p>

              </label>

            </div>



            ${!isInitial ? `

            <div class="pt-2 border-t border-(--hh-card-border) flex items-center justify-between">

              <label class="flex items-center gap-2 cursor-pointer text-xs font-bold text-rose-600 hover:opacity-80">

                <input type="checkbox" id="chkResetPresetMode" class="accent-rose-500 rounded">

                <span>重置該學制為初始範本科目 (清空該模式現有修改)</span>

              </label>

            </div>

            ` : ''}

          </div>

        `,

        confirmText: isInitial ? '確認建立' : '切換至此模式',

        onConfirm: async () => {

          const selected = document.querySelector('input[name="presetModeRadio"]:checked');

          if (!selected) {

            showToast('請選擇預設模式', 'danger');

            return;

          }

          const modeKey = selected.value;

          const chkReset = document.getElementById('chkResetPresetMode');

          const isReset = chkReset ? chkReset.checked : false;

          await applyPresetMode(modeKey, isReset);

          closeModal();

        }

      });

    }



    async function applyPresetMode(modeKey, isReset = false) {

      const preset = PRESET_MODES[modeKey];

      if (!preset) return;



      state.currentPresetMode = modeKey;



      if (globalStore.state.currentDashboardContext === 'personal' && supabaseClient && globalStore.state.currentUser) {

        try {

          // Update profile current_preset_mode

          await supabaseClient.from('profiles').update({ current_preset_mode: modeKey }).eq('id', globalStore.state.currentUser.id);



          if (isReset) {

            await supabaseClient.from('subjects').delete().eq('user_id', globalStore.state.currentUser.id).is('group_id', null).eq('preset_mode', modeKey);

            state.subjects = (state.subjects || []).filter(s => (s.preset_mode || 'senior') !== modeKey);

          }



          await loadDashboardData();

          showToast(`已成功切換至【${preset.name}】獨立看板`, 'success');

        } catch (err) {

          console.error('Failed applying preset to Supabase:', err);

          showToast('切換預設模式失敗: ' + err.message, 'danger');

        }

      } else {

        // Local / Offline mode

        const activeFolder = getActiveFolder();

        if (!activeFolder) {

          showToast('尚未建立任何專案資料夾', 'warning');

          return;

        }



        if (isReset) {

          activeFolder.subjects = (activeFolder.subjects || []).filter(s => (s.preset_mode || 'senior') !== modeKey);

        }



        const modeSubs = (activeFolder.subjects || []).filter(s => (s.preset_mode || 'senior') === modeKey);

        if (modeSubs.length === 0 && preset.subjects.length > 0) {

          if (!activeFolder.subjects) activeFolder.subjects = [];

          preset.subjects.forEach((pSub, idx) => {

            activeFolder.subjects.push({

              id: `sub_${modeKey}_${Date.now()}_${idx}`,

              name: pSub.name,

              preset_mode: modeKey,

              ranges: []

            });

          });

        }



        validateStateDefensive();

        saveState();

        renderAll();

        showToast(`已成功切換至【${preset.name}】獨立看板`, 'success');

      }

    }



    function promptProfileSetupModal(isOnboarding = false) {

      const defaultNick = globalStore.state.currentUser ? globalStore.state.currentUser.nickname : '學習者';

      const defaultAvatar = globalStore.state.currentUser ? globalStore.state.currentUser.avatarUrl : '';



      openModal({

        title: isOnboarding ? '歡迎！請完成個人資料設定' : '編輯個人檔案與頭像',

        icon: 'user-circle',

        contentHtml: `

          <div class="space-y-4">

            <div>

              <label class="block text-xs font-black hh-headline mb-1.5">使用者暱稱</label>

              <input type="text" id="inputNickname" value="${escapeHtml(defaultNick)}" required class="w-full px-3.5 py-2 text-xs font-bold hh-input">

            </div>



            <div>

              <label class="block text-xs font-black hh-headline mb-1.5">選擇或貼上頭像網址</label>

              <div class="flex gap-2 mb-2">

                <input type="text" id="inputAvatarUrl" value="${escapeHtml(defaultAvatar)}" placeholder="https://..." class="flex-1 px-3.5 py-2 text-xs font-bold hh-input">

                <button id="btnRandomAvatar" type="button" class="hh-btn-secondary px-3 py-2 text-xs font-bold whitespace-nowrap">

                  🎲 隨機產生

                </button>

              </div>

              <div class="flex items-center gap-3 mt-2">

                <label for="inputAvatarFile" class="hh-btn-secondary px-3 py-2 text-xs font-bold cursor-pointer inline-flex items-center gap-2 whitespace-nowrap">

                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>

                  從裝置選擇圖片

                </label>

                <input type="file" id="inputAvatarFile" accept="image/*" class="hidden">

                <span id="avatarUploadStatus" class="text-xs text-(--hh-text-dim) truncate max-w-[120px]"></span>

              </div>

            </div>

          </div>

        `,

        confirmText: '儲存設定',

        onConfirm: async () => {

          const nickname = document.getElementById('inputNickname').value.trim();

          const avatarUrl = document.getElementById('inputAvatarUrl').value.trim();



          if (!nickname) {

            showToast('請輸入暱稱', 'danger');

            return;

          }



          if (globalStore.state.currentUser) {

            globalStore.state.currentUser.nickname = nickname;



            let finalAvatarUrl = avatarUrl || ('https://api.dicebear.com/7.x/bottts/svg?seed=' + globalStore.state.currentUser.id);

            let uploadedToStorage = false;



            if (avatarUrl.startsWith('data:image/')) {

              if (supabaseClient) {

                const statusEl = document.getElementById('avatarUploadStatus');

                if (statusEl) {

                  statusEl.textContent = '上傳雲端中...';

                  statusEl.className = 'text-xs text-(--hh-text-dim) truncate max-w-[120px]';

                }

                try {

                  const res = await fetch(avatarUrl);

                  const blob = await res.blob();

                  const filename = `${globalStore.state.currentUser.id}_${Date.now()}.jpg`;

                  const { data, error } = await supabaseClient.storage.from('avatars').upload(filename, blob, { upsert: true });

                  if (error) throw error;

                  const { data: publicUrlData } = supabaseClient.storage.from('avatars').getPublicUrl(filename);

                  finalAvatarUrl = publicUrlData.publicUrl;

                  uploadedToStorage = true;

                  localStorage.removeItem(`local_avatar_${globalStore.state.currentUser.id}`);

                } catch (err) {

                  console.error('Failed to upload avatar to Supabase Storage, falling back to localStorage', err);

                  localStorage.setItem(`local_avatar_${globalStore.state.currentUser.id}`, avatarUrl);

                  finalAvatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${globalStore.state.currentUser.id}#local`;

                }

              } else {

                localStorage.setItem(`local_avatar_${globalStore.state.currentUser.id}`, avatarUrl);

                finalAvatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${globalStore.state.currentUser.id}#local`;

              }

            } else {

              localStorage.removeItem(`local_avatar_${globalStore.state.currentUser.id}`);

            }



            globalStore.state.currentUser.avatarUrl = avatarUrl.startsWith('data:image/') && !uploadedToStorage ? avatarUrl : finalAvatarUrl;



            if (supabaseClient) {

              await supabaseClient.from('profiles').upsert({

                id: globalStore.state.currentUser.id,

                nickname: globalStore.state.currentUser.nickname,

                avatar_url: finalAvatarUrl

              });

            }

          }



          renderAuthPill();

          closeModal();

          showToast('個人檔案更新成功！', 'success');

        }

      });



      document.getElementById('btnRandomAvatar').onclick = () => {

        const seed = Math.random().toString(36).substring(7);

        document.getElementById('inputAvatarUrl').value = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;

        const statusEl = document.getElementById('avatarUploadStatus');

        if (statusEl) statusEl.textContent = '';

      };



      const fileInput = document.getElementById('inputAvatarFile');

      if (fileInput) {

        fileInput.addEventListener('change', function (e) {

          const file = e.target.files[0];

          if (!file) return;



          const statusEl = document.getElementById('avatarUploadStatus');

          statusEl.textContent = '處理中...';

          statusEl.className = 'text-xs text-(--hh-text-dim) truncate max-w-[120px]';



          const reader = new FileReader();

          reader.onload = function (event) {

            const img = new Image();

            img.onload = function () {

              const canvas = document.createElement('canvas');

              const maxSize = 400;

              let width = img.width;

              let height = img.height;



              if (width > height) {

                if (width > maxSize) {

                  height *= maxSize / width;

                  width = maxSize;

                }

              } else {

                if (height > maxSize) {

                  width *= maxSize / height;

                  height = maxSize;

                }

              }



              canvas.width = width;

              canvas.height = height;

              const ctx = canvas.getContext('2d');

              ctx.drawImage(img, 0, 0, width, height);



              const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

              document.getElementById('inputAvatarUrl').value = dataUrl;

              statusEl.textContent = '載入成功';

              statusEl.className = 'text-xs text-(--hh-accent-green) font-bold truncate max-w-[120px]';

            };

            img.src = event.target.result;

          };

          reader.readAsDataURL(file);

        });

      }

    }



    function promptCreateGroupModal() {

      const code = generateNumericInviteCode();



      openModal({

        title: '建立全新學習群組',

        icon: 'users',

        contentHtml: `

          <div class="space-y-4">

            <div>

              <label class="block text-xs font-black hh-headline mb-1.5">群組名稱</label>

              <input type="text" id="inputGroupName" placeholder="例如: 高三學測國文衝刺組" required class="w-full px-3.5 py-2 text-xs font-bold hh-input">

            </div>



            <div>

              <label class="block text-xs font-black hh-headline mb-1.5">專屬 6 位數數字邀請碼</label>

              <div class="flex items-center gap-2">

                <input type="text" id="inputGroupCode" value="${code}" readonly class="flex-1 px-3.5 py-2 text-sm font-mono font-black text-center hh-input bg-(--hh-accent-ice)">

                <button type="button" id="btnRefreshCode" class="hh-btn-secondary px-3 py-2 text-xs" title="重新產生號碼">

                  <i data-lucide="rotate-cw" class="w-4 h-4"></i>

                </button>

              </div>

              <p class="text-[11px] font-semibold text-(--hh-paragraph) opacity-75 mt-1">其他人需輸入此數字邀請碼發送申請，經您核准後即可加入群組。</p>

            </div>

          </div>

        `,

        confirmText: '建立群組',

        onConfirm: async () => {

          const name = document.getElementById('inputGroupName').value.trim();

          const invite_code = document.getElementById('inputGroupCode').value.trim();



          if (!name) {

            showToast('請輸入群組名稱', 'danger');

            return;

          }



          if (supabaseClient && globalStore.state.currentUser) {

            const { data, error } = await supabaseClient.from('groups').insert({

              name,

              invite_code,

              owner_id: globalStore.state.currentUser.id

            }).select().single();



            if (error) {

              showToast('建立失敗: ' + error.message, 'danger');

              return;

            }

            await supabaseClient.from('group_members').insert({

              group_id: data.id,

              user_id: globalStore.state.currentUser.id,

              role: 'owner'

            });

            globalStore.state.myGroups = [...globalStore.state.myGroups, data];
            closeModal();
            showToast(`成功建立群組「${name}」 (邀請碼: ${invite_code})`, 'success');
            await switchDashboardContext(data.id);
          } else {
            const newGroup = {
              id: generateId('grp'),
              name,
              invite_code,
              owner_id: 'local_owner',
              created_at: new Date().toISOString()
            };
            globalStore.state.myGroups = [...globalStore.state.myGroups, newGroup];
            closeModal();
            showToast(`成功建立群組「${name}」 (邀請碼: ${invite_code})`, 'success');
            await switchDashboardContext(newGroup.id);
          }

        }

      });



      document.getElementById('btnRefreshCode').onclick = () => {

        document.getElementById('inputGroupCode').value = generateNumericInviteCode();

      };

    }



    function promptJoinGroupModal() {

      openModal({

        title: '輸入數字邀請碼申請加入群組',

        icon: 'key-round',

        contentHtml: `

          <div class="space-y-4">

            <div>

              <label class="block text-xs font-black hh-headline mb-1.5">6 位數字邀請碼</label>

              <input type="text" id="inputJoinCode" maxlength="6" placeholder="請輸入 6 位數字 (例如 839201)" required class="w-full px-3.5 py-2.5 text-lg font-mono font-black text-center tracking-widest hh-input">

            </div>

            <p class="text-[11px] font-bold text-(--hh-paragraph) opacity-75">

              送出申請後需等待該群組管理員審核同意，同意後系統將自動為您解鎖該群組。

            </p>

          </div>

        `,

        confirmText: '送出加入申請',

        onConfirm: async () => {

          const code = document.getElementById('inputJoinCode').value.trim();

          if (!code || code.length !== 6) {

            showToast('請輸入正確的 6 位數邀請碼', 'danger');

            return;

          }



          if (supabaseClient && globalStore.state.currentUser) {

            const { data: grp, error } = await supabaseClient.from('groups').select('*').eq('invite_code', code).single();

            if (error || !grp) {

              showToast('找不到與該邀請碼相符的群組，請確認號碼', 'danger');

              return;

            }



            const isMember = globalStore.state.myGroups.some(g => g.id === grp.id);

            if (isMember) {
              closeModal();
              showToast(`您已經是群組「${grp.name}」的成員了！`, 'info');
              await switchDashboardContext(grp.id);
              return;
            }



            const { error: reqError } = await supabaseClient.from('group_join_requests').insert({

              group_id: grp.id,

              user_id: globalStore.state.currentUser.id,

              status: 'pending'

            });



            if (reqError) {

              if (reqError.code === '23505') {

                showToast(`您先前已向「${grp.name}」發送過加入申請，請等候審核！`, 'info');

              } else {

                showToast('發送申請失敗: ' + reqError.message, 'danger');

              }

              closeModal();

              return;

            }



            closeModal();

            showToast(`已向群組「${grp.name}」送出加入申請，等待管理員審核！`, 'success');

          } else {
            const mockGrp = {
              id: generateId('mockgrp'),
              name: `模擬群組 ${code}`,
              invite_code: code,
              owner_id: 'mock_owner',
              created_at: new Date().toISOString()
            };
            globalStore.state.myGroups = [...globalStore.state.myGroups, mockGrp];
            closeModal();
            showToast(`已模擬加入群組「${mockGrp.name}」！`, 'success');
            await switchDashboardContext(mockGrp.id);
          }

        }

      });

    }



    async function deleteGroup(groupId, groupName) {

      if (!supabaseClient) {

        showToast('需要連接資料庫才能刪除群組', 'danger');

        return;

      }

      openModal({

        title: '⚠️ 刪除群組確認',

        icon: 'alert-triangle',

        contentHtml: `

          <div class="text-sm text-(--hh-paragraph) mb-3">

            您確定要刪除群組 <strong>${escapeHtml(groupName)}</strong> 嗎？<br>

            這將會刪除群組內所有的科目、單元與學習資源，且<span class="text-rose-500 font-bold">無法復原</span>。<br>

            請在下方輸入群組名稱以確認刪除：

          </div>

          <input type="text" id="inputConfirmGroupName" class="w-full bg-(--hh-card) border border-(--hh-card-border) rounded-xl px-3 py-2 text-sm text-(--hh-headline) placeholder-slate-400 focus:outline-none focus:border-(--hh-accent-teal)" placeholder="請輸入 ${escapeHtml(groupName)}">

        `,

        confirmText: '確定刪除',

        onConfirm: async () => {
          const inputVal = document.getElementById('inputConfirmGroupName').value.trim();
          if (inputVal !== groupName) {
            showToast('群組名稱輸入錯誤，刪除已取消', 'danger');
            return;
          }

          closeModal();

          const { error } = await supabaseClient.from('groups').delete().eq('id', groupId);
          if (error) {
            showToast('刪除群組失敗: ' + error.message, 'danger');
          } else {
            showToast('已成功刪除群組，已切換至個人雲端 DASHBOARD', 'success');
            await switchDashboardContext('personal');
          }
        }
      });
    }

    async function kickGroupMember(groupId, userId, nickname, groupName) {
      if (!supabaseClient) return;

      openModal({
        title: '⚠️ 剔除成員確認',
        icon: 'alert-triangle',
        contentHtml: `
          <div class="text-sm text-(--hh-paragraph)">
            確定要將成員 <strong>${escapeHtml(nickname)}</strong> 踢除出群組 <strong>${escapeHtml(groupName)}</strong> 嗎？
          </div>
        `,
        confirmText: '確定踢除',
        onConfirm: async () => {
          closeModal();
          const { error } = await supabaseClient.from('group_members').delete().eq('group_id', groupId).eq('user_id', userId);
          if (error) {
            showToast('踢除成員失敗: ' + error.message, 'danger');
          } else {
            showToast('已成功踢除成員', 'success');
            await loadUserGroups();
          }
        }
      });
    }

    async function leaveGroup(groupId, groupName) {
      if (!supabaseClient || !globalStore.state.currentUser) return;

      const membership = globalStore.state.myGroups.find(g => g.id === groupId);
      if (!membership) return;

      openModal({
        title: '⚠️ 退出群組確認',
        icon: 'log-out',
        contentHtml: `
          <div class="text-sm text-(--hh-paragraph)">
            確定要退出群組 <strong>${escapeHtml(groupName)}</strong> 嗎？
          </div>
        `,
        confirmText: '確定退出',
        onConfirm: async () => {
          closeModal();
          const isOwner = membership.owner_id === globalStore.state.currentUser.id;

          if (isOwner) {
            const { data: members, error: memErr } = await supabaseClient
              .from('group_members')
              .select('*')
              .eq('group_id', groupId)
              .neq('user_id', globalStore.state.currentUser.id)
              .order('joined_at', { ascending: true });

            if (memErr) {
              showToast('退出群組失敗: 讀取成員錯誤', 'danger');
              return;
            }

            if (members && members.length > 0) {
              const nextOwner = members[0];
              await supabaseClient.from('groups').update({ owner_id: nextOwner.user_id }).eq('id', groupId);
              await supabaseClient.from('group_members').update({ role: 'owner' }).eq('group_id', groupId).eq('user_id', nextOwner.user_id);
              const { error: delErr } = await supabaseClient.from('group_members').delete().eq('group_id', groupId).eq('user_id', globalStore.state.currentUser.id);
              if (delErr) {
                showToast('退出群組時發生錯誤', 'danger');
              } else {
                showToast('已退出群組，建立者權限已自動移交', 'success');
              }
            } else {
              await supabaseClient.from('groups').delete().eq('id', groupId);
              showToast('已退出並自動解散群組', 'success');
            }
          } else {
            const { error: delErr } = await supabaseClient.from('group_members').delete().eq('group_id', groupId).eq('user_id', globalStore.state.currentUser.id);
            if (delErr) {
              showToast('退出群組失敗: ' + delErr.message, 'danger');
            } else {
              showToast('已成功退出群組', 'success');
            }
          }

          await switchDashboardContext('personal');
        }
      });

    }



    async function promptManageGroupsModal() {

      let pendingHtml = '';



      if (globalStore.state.pendingJoinRequests.length === 0) {

        pendingHtml = `<p class="text-xs font-bold text-slate-400 py-3 text-center">目前無任何待審核加入申請</p>`;

      } else {

        pendingHtml = globalStore.state.pendingJoinRequests.map(req => {

          const nick = req.profiles ? req.profiles.nickname : '新使用者';

          const avatar = req.profiles ? req.profiles.avatar_url : 'https://api.dicebear.com/7.x/bottts/svg?seed=user';

          const grpName = req.groups ? req.groups.name : '群組';



          return `

            <div class="flex items-center justify-between p-2.5 rounded-xl border border-(--hh-card-border) bg-(--hh-accent-ice) mb-2">

              <div class="flex items-center gap-2.5">

                <img src="${escapeHtml(avatar)}" class="w-7 h-7 rounded-full object-cover border border-(--hh-card-border)">

                <div>

                  <div class="font-extrabold text-xs text-(--hh-headline)">${escapeHtml(nick)}</div>

                  <div class="text-[10px] font-semibold text-(--hh-paragraph) opacity-75">申請加入：${escapeHtml(grpName)}</div>

                </div>

              </div>

              <div class="flex items-center gap-1.5">

                <button class="btn-approve-req px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[11px]" data-id="${req.id}">同意</button>

                <button class="btn-reject-req px-2.5 py-1 bg-rose-500 text-white rounded-lg font-bold text-[11px]" data-id="${req.id}">拒絕</button>

              </div>

            </div>

          `;

        }).join('');

      }



      // Fetch group members if connected

      let myGroupsWithMembers = [];

      if (supabaseClient && globalStore.state.myGroups.length > 0) {

        const groupIds = globalStore.state.myGroups.map(g => g.id);

        const { data: membersData } = await supabaseClient

          .from('group_members')

          .select('group_id, role, joined_at, profiles(id, nickname, avatar_url)')

          .in('group_id', groupIds);



        myGroupsWithMembers = globalStore.state.myGroups.map(g => {

          const members = membersData ? membersData.filter(m => m.group_id === g.id) : [];

          return { ...g, members };

        });

      } else {

        myGroupsWithMembers = globalStore.state.myGroups.map(g => ({ ...g, members: [] }));

      }



      openModal({

        title: '群組管理與待審核申請名單',

        icon: 'user-check',

        contentHtml: `

          <div class="space-y-4">

            <div>

              <h5 class="text-xs font-black hh-headline mb-2 uppercase flex items-center gap-1">

                <i data-lucide="clock" class="w-4 h-4"></i>

                <span>待審核加入申請 (${globalStore.state.pendingJoinRequests.length})</span>

              </h5>

              <div class="max-h-48 overflow-y-auto pr-1">

                ${pendingHtml}

              </div>

            </div>



            <div>

              <h5 class="text-xs font-black hh-headline mb-2 uppercase">我已加入的群組 (${globalStore.state.myGroups.length})</h5>

              <div class="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">

                ${myGroupsWithMembers.map(g => {

          const isOwner = globalStore.state.currentUser && g.owner_id === globalStore.state.currentUser.id;

          return `

                  <div class="p-2.5 rounded-lg border border-(--hh-card-border) bg-(--hh-card)">

                    <div class="flex items-center justify-between mb-2">

                      <span class="font-bold">👥 ${escapeHtml(g.name)}</span>

                      <div class="flex items-center gap-1.5">

                        <span class="font-mono text-[10px] bg-(--hh-accent-ice) px-2 py-0.5 rounded border">碼: ${g.invite_code}</span>

                        ${isOwner ? `<button class="btn-delete-group text-rose-500 hover:text-rose-600 transition p-1 rounded hover:bg-rose-500/10" data-id="${g.id}" data-name="${escapeHtml(g.name)}" title="刪除群組"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>` : ''}

                        <button class="btn-leave-group text-slate-400 hover:text-rose-500 transition p-1 rounded hover:bg-slate-100" data-id="${g.id}" data-name="${escapeHtml(g.name)}" title="退出群組"><i data-lucide="log-out" class="w-3.5 h-3.5"></i></button>

                      </div>

                    </div>

                    <div class="space-y-1.5 pl-1 border-l-2 border-(--hh-accent-teal)">

                      ${g.members.length > 0 ? g.members.map(m => `

                        <div class="flex items-center justify-between gap-2">

                          <div class="flex items-center gap-2">

                            <img src="${escapeHtml(m.profiles?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=user')}" class="w-5 h-5 rounded-full object-cover border border-(--hh-card-border)">

                            <span class="font-semibold ${m.role === 'owner' ? 'text-(--hh-btn-main)' : 'text-(--hh-paragraph)'}">

                              ${escapeHtml(m.profiles?.nickname || '未知使用者')}

                            </span>

                            ${m.role === 'owner' ? '<span class="text-[9px] bg-(--hh-badge-bg) text-(--hh-badge-text) px-1.5 py-0.5 rounded border border-(--hh-badge-text)">建立者</span>' : ''}

                          </div>

                          ${(isOwner && m.profiles?.id !== globalStore.state.currentUser.id) ? `

                            <button class="btn-kick-member text-[10px] bg-rose-500/10 text-rose-500 px-2 py-1 rounded-md hover:bg-rose-500 hover:text-white transition font-bold" data-group-id="${g.id}" data-user-id="${m.profiles?.id}" data-nickname="${escapeHtml(m.profiles?.nickname || '未知')}" data-group-name="${escapeHtml(g.name)}">踢除</button>

                          ` : ''}

                        </div>

                      `).join('') : '<div class="text-[10px] text-slate-400">尚無成員資料 (或處於離線狀態)</div>'}

                    </div>

                  </div>

                `}).join('')}

              </div>

            </div>

          </div>

        `,

        confirmText: '完成關閉',

        onConfirm: () => closeModal()

      });



      document.querySelectorAll('.btn-approve-req').forEach(btn => {

        btn.onclick = async (e) => {

          const reqId = e.target.dataset.id;

          const req = globalStore.state.pendingJoinRequests.find(r => r.id === reqId);

          if (req && supabaseClient) {

            await supabaseClient.from('group_join_requests').update({ status: 'approved' }).eq('id', reqId);

            await supabaseClient.from('group_members').insert({

              group_id: req.group_id,

              user_id: req.user_id,

              role: 'member'

            });

            showToast('已審核同意加入申請！', 'success');

            await loadUserGroups();

            closeModal();

          }

        };

      });



      document.querySelectorAll('.btn-reject-req').forEach(btn => {

        btn.onclick = async (e) => {

          const reqId = e.target.dataset.id;

          if (supabaseClient) {

            await supabaseClient.from('group_join_requests').update({ status: 'rejected' }).eq('id', reqId);

            showToast('已拒絕該申請', 'info');

            await loadUserGroups();

            closeModal();

          }

        };

      });



      document.querySelectorAll('.btn-delete-group').forEach(btn => {

        btn.onclick = (e) => {

          const btnEl = e.currentTarget;

          deleteGroup(btnEl.dataset.id, btnEl.dataset.name);

        };

      });



      document.querySelectorAll('.btn-leave-group').forEach(btn => {

        btn.onclick = (e) => {

          const btnEl = e.currentTarget;

          leaveGroup(btnEl.dataset.id, btnEl.dataset.name);

        };

      });



      document.querySelectorAll('.btn-kick-member').forEach(btn => {

        btn.onclick = (e) => {

          const btnEl = e.currentTarget;

          kickGroupMember(btnEl.dataset.groupId, btnEl.dataset.userId, btnEl.dataset.nickname, btnEl.dataset.groupName);

        };

      });

    }







    // --- Toast Notification System ---



    function showToast(message, type = 'success') {

      const container = document.getElementById('toastContainer');

      const toast = document.createElement('div');



      let borderColors = 'bg-(--hh-btn-main) text-(--hh-btn-text) border-2 border-(--hh-card-border)';

      let iconName = 'check-circle-2';



      if (type === 'info') {

        borderColors = 'bg-(--hh-accent-blush) text-(--hh-card-border) border-2 border-(--hh-card-border)';

        iconName = 'info';

      } else if (type === 'danger') {

        borderColors = 'bg-rose-500 text-white border-2 border-rose-900';

        iconName = 'alert-circle';

      }



      toast.className = `pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-[4px_4px_0px_0px_var(--hh-shadow)] text-xs font-bold transition-all duration-300 animate-pop-in ${borderColors}`;

      toast.innerHTML = `

        <i data-lucide="${iconName}" class="w-4 h-4 shrink-0"></i>

        <span>${escapeHtml(message)}</span>

      `;



      container.appendChild(toast);

      lucide.createIcons({ props: { searchTarget: toast } });



      setTimeout(() => {

        toast.style.opacity = '0';

        toast.style.transform = 'translateY(10px)';

        setTimeout(() => toast.remove(), 300);

      }, 2800);

    }



    function escapeHtml(str) {

      if (!str) return '';

      return String(str).replace(/[&<>"']/g, (m) => {

        return {

          '&': '&amp;',

          '<': '&lt;',

          '>': '&gt;',

          '"': '&quot;',

          "'": '&#039;'

        }[m];

      });

    }



    // --- Personal Data Import Modal ---

    async function promptImportPersonalDataModal() {
      console.log("promptImportPersonalDataModal called!", {
        supabaseClient: !!supabaseClient,
        currentDashboardContext: globalStore.state.currentDashboardContext,
        currentUser: globalStore.state.currentUser ? globalStore.state.currentUser.id : null,
        myGroups: globalStore.state.myGroups
      });

      if (!supabaseClient) {
        Swal.fire('Error', 'Supabase client not initialized', 'error');
        return;
      }
      if (globalStore.state.currentDashboardContext === 'personal') {
        Swal.fire('Error', '目前在個人模式', 'error');
        return;
      }

      const currentGroupId = globalStore.state.currentDashboardContext;
      const groupData = globalStore.state.myGroups.find(g => g.id === currentGroupId);
      
      if (!groupData) {
        Swal.fire('Error', '找不到群組資料', 'error');
        console.log("myGroups:", globalStore.state.myGroups, "currentGroupId:", currentGroupId);
        return;
      }
      
      if (groupData.owner_id !== globalStore.state.currentUser.id) {
        Swal.fire('Error', '只有群組建立者可以匯入', 'error');
        return;
      }



      // 1. Fetch all personal subjects, ranges, and resource links
      const { data: rawSubjects, error: subErr } = await supabaseClient
        .from('subjects')
        .select('*')
        .eq('user_id', globalStore.state.currentUser.id)
        .is('group_id', null)
        .order('created_at', { ascending: true });

      // 過濾掉內部使用的 ___FOLDER_META___ 特殊紀錄
      const pSubjects = (rawSubjects || []).filter(s => s.name !== '___FOLDER_META___');

      if (subErr || !pSubjects || pSubjects.length === 0) {
        Swal.fire('無資料', '您的個人雲端目前沒有任何科目可以匯入。', 'info');
        return;
      }



      // Fetch ranges and links for personal subjects

      const subIds = pSubjects.map(s => s.id);

      const { data: pRanges, error: rngErr } = await supabaseClient

        .from('ranges')

        .select('*')

        .in('subject_id', subIds)
        
        .order('created_at', { ascending: true });



      const rangeIds = (pRanges || []).map(r => r.id);

      const { data: pLinks, error: lnkErr } = await supabaseClient

        .from('resource_links')

        .select('*')

        .in('range_id', rangeIds.length > 0 ? rangeIds : ['00000000-0000-0000-0000-000000000000']) // Fallback to avoid empty array error
        
        .order('created_at', { ascending: true });



      // 2. Render Checkbox UI

      const contentHtml = `

        <div class="space-y-4">

          <div class="p-3 bg-(--hh-accent-ice) rounded-xl border border-(--hh-card-border) mb-4">

            <h4 class="font-bold text-xs mb-1">💡 智慧合併說明</h4>

            <p class="text-[11px] opacity-80 leading-relaxed">此功能將把您在個人雲端建立的科目、單元與連結複製到此群組。如果群組已有同名科目或單元將會自動進行合併，相同的連結會自動跳過避免重複。</p>

          </div>

          

          <div class="flex items-center justify-between mb-2">

            <h4 class="font-bold text-sm text-(--hh-headline)">選擇要匯入的個人科目</h4>

            <button id="btnImportSelectAll" class="text-xs font-bold text-blue-500 hover:underline">全選/取消全選</button>

          </div>

          <div class="max-h-60 overflow-y-auto pr-2 space-y-2" id="importSubjectList">

            ${pSubjects.map(s => {

        const rCount = (pRanges || []).filter(r => r.subject_id === s.id).length;

        return `

                <label class="flex items-center p-3 rounded-xl border border-(--hh-card-border) bg-(--hh-card) hover:bg-(--hh-bg-main) cursor-pointer transition">

                  <input type="checkbox" value="${s.id}" class="import-subject-cb w-4 h-4 text-blue-600 rounded mr-3" checked>

                  <div class="flex-1">

                    <div class="font-bold text-sm text-(--hh-headline)">${escapeHtml(s.name)}</div>

                    <div class="text-[10px] text-(--hh-paragraph) opacity-70">包含 ${rCount} 個單元範圍</div>

                  </div>

                </label>

              `;

      }).join('')}

          </div>

        </div>

      `;



      openModal({

        title: '匯入個人學習資料',

        icon: 'download',

        contentHtml,

        confirmText: '開始匯入',

        onConfirm: async () => {

          const checkboxes = document.querySelectorAll('.import-subject-cb:checked');

          if (checkboxes.length === 0) {

            Swal.showValidationMessage('請至少選擇一個科目');

            return false;

          }



          const selectedSubIds = Array.from(checkboxes).map(cb => cb.value);

          if (selectedSubIds.length === 0) return true;



          closeModal();

          Swal.fire({

            title: '匯入中...',

            text: '正在進行智慧合併與複製，請稍候。',

            allowOutsideClick: false,

            didOpen: () => Swal.showLoading()

          });



          try {

            const targetFolderId = state.groupFolders[currentGroupId]?.activeFolderId || 'blank';

            let importedSubsCount = 0;

            let importedRangesCount = 0;

            let importedLinksCount = 0;
            
            let baseTime = Date.now();



            // Fetch current group data for Smart Merge

            const { data: gSubjects } = await supabaseClient.from('subjects').select('*').eq('group_id', currentGroupId).eq('preset_mode', targetFolderId);

            const gSubIds = (gSubjects || []).map(s => s.id);

            const { data: gRanges } = await supabaseClient.from('ranges').select('*').in('subject_id', gSubIds.length > 0 ? gSubIds : ['00000000-0000-0000-0000-000000000000']);

            const gRangeIds = (gRanges || []).map(r => r.id);

            const { data: gLinks } = await supabaseClient.from('resource_links').select('*').in('range_id', gRangeIds.length > 0 ? gRangeIds : ['00000000-0000-0000-0000-000000000000']);



            const groupSubjectsMap = new Map((gSubjects || []).map(s => [s.name, s]));

            const groupRangesMap = new Map(); // key: subject_id_range_name

            (gRanges || []).forEach(r => groupRangesMap.set(`${r.subject_id}_${r.name}`, r));

            const groupLinksSet = new Set(); // key: range_id_url_title

            (gLinks || []).forEach(l => groupLinksSet.add(`${l.range_id}_${l.url}_${l.title}`));



            for (const subId of selectedSubIds) {

              const pSub = pSubjects.find(s => s.id === subId);

              if (!pSub) continue;



              // 1. Merge Subject

              let targetSub = groupSubjectsMap.get(pSub.name);

              if (!targetSub) {

                const { data: newSub, error: insSubErr } = await supabaseClient.from('subjects').insert({

                  name: pSub.name,

                  user_id: globalStore.state.currentUser.id,

                  group_id: currentGroupId,

                  preset_mode: targetFolderId,

                  created_at: new Date(baseTime++).toISOString()

                }).select().single();

                if (insSubErr) throw insSubErr;

                targetSub = newSub;

                groupSubjectsMap.set(targetSub.name, targetSub);

                importedSubsCount++;

              } else {
              
                const newTime = new Date(baseTime++).toISOString();
                
                const { error: updErr } = await supabaseClient.from('subjects').update({ created_at: newTime }).eq('id', targetSub.id);
                
                if (updErr) throw updErr;
                
                targetSub.created_at = newTime;
                
              }



              // 2. Merge Ranges

              const subRanges = (pRanges || []).filter(r => r.subject_id === pSub.id);

              for (const pRange of subRanges) {

                let targetRange = groupRangesMap.get(`${targetSub.id}_${pRange.name}`);

                if (!targetRange) {

                  const { data: newRange, error: insRngErr } = await supabaseClient.from('ranges').insert({

                    subject_id: targetSub.id,

                    name: pRange.name,
                    
                    created_at: new Date(baseTime++).toISOString()

                  }).select().single();

                  if (insRngErr) throw insRngErr;

                  targetRange = newRange;

                  groupRangesMap.set(`${targetSub.id}_${targetRange.name}`, targetRange);

                  importedRangesCount++;

                } else {
                
                  const newTime = new Date(baseTime++).toISOString();
                  
                  const { error: updErr } = await supabaseClient.from('ranges').update({ created_at: newTime }).eq('id', targetRange.id);
                  
                  if (updErr) throw updErr;
                  
                  targetRange.created_at = newTime;
                  
                }



                // 3. Merge Links

                const rangeLinks = (pLinks || []).filter(l => l.range_id === pRange.id);

                for (const pLink of rangeLinks) {

                  const linkKey = `${targetRange.id}_${pLink.url}_${pLink.title}`;

                  if (!groupLinksSet.has(linkKey)) {

                    const { error: insLnkErr } = await supabaseClient.from('resource_links').insert({

                      range_id: targetRange.id,

                      title: pLink.title,

                      url: pLink.url,

                      created_by: globalStore.state.currentUser.id,

                      last_edited_by: globalStore.state.currentUser.id,
                      
                      created_at: new Date(baseTime++).toISOString()

                    });

                    if (insLnkErr) throw insLnkErr;

                    groupLinksSet.add(linkKey);

                    importedLinksCount++;

                  } else {
                  
                    const newTime = new Date(baseTime++).toISOString();
                    
                    const { error: updErr } = await supabaseClient.from('resource_links').update({ created_at: newTime }).eq('range_id', targetRange.id).eq('url', pLink.url).eq('title', pLink.title);
                    
                    if (updErr) throw updErr;
                    
                  }

                }

              }

            }



            Swal.fire({

              icon: 'success',

              title: '匯入成功！',

              text: `共匯入 ${importedSubsCount} 個科目、${importedRangesCount} 個單元與 ${importedLinksCount} 個資源連結`,

              timer: 3000,

              showConfirmButton: false

            });

            await loadDashboardData(); // Refresh UI

          } catch (err) {

            console.error('Import Error:', err);

            Swal.fire('匯入失敗', err.message || '發生未知錯誤', 'error');

          }

        }

      });



      // Handle Select All logic

      setTimeout(() => {

        const btnSelectAll = document.getElementById('btnImportSelectAll');

        if (btnSelectAll) {

          btnSelectAll.onclick = () => {

            const checkboxes = document.querySelectorAll('.import-subject-cb');

            const allChecked = Array.from(checkboxes).every(cb => cb.checked);

            checkboxes.forEach(cb => cb.checked = !allChecked);

          };

        }

      }, 100);

    }



    // --- Custom Modal System ---



    let modalConfirmCallback = null;



    function openModal({ title, icon = 'edit', contentHtml, confirmText = '確認', confirmClass = 'hh-btn-primary', onConfirm }) {

      const overlay = document.getElementById('modalOverlay');

      const card = document.getElementById('modalContent');

      const titleEl = document.getElementById('modalTitle');

      const bodyEl = document.getElementById('modalBody');

      const confirmBtn = document.getElementById('btnModalConfirm');



      titleEl.innerHTML = `<i data-lucide="${icon}" class="w-5 h-5"></i> <span>${escapeHtml(title)}</span>`;

      bodyEl.innerHTML = contentHtml;



      confirmBtn.textContent = confirmText;

      confirmBtn.className = `px-5 py-2 text-xs font-black ${confirmClass}`;



      modalConfirmCallback = onConfirm;



      overlay.classList.remove('opacity-0', 'pointer-events-none');

      card.classList.remove('scale-95');

      card.classList.add('scale-100');



      lucide.createIcons({ props: { searchTarget: titleEl } });



      const firstInput = bodyEl.querySelector('input');

      if (firstInput) {

        setTimeout(() => firstInput.focus(), 50);

      }

    }



    function closeModal() {

      const overlay = document.getElementById('modalOverlay');

      const card = document.getElementById('modalContent');



      overlay.classList.add('opacity-0', 'pointer-events-none');

      card.classList.remove('scale-100');

      card.classList.add('scale-95');

      modalConfirmCallback = null;

    }



    // --- Rendering Engines ---



    function renderAll() {

      validateStateDefensive();

      renderFolderBar();

      renderPresetModeBadge();

      renderSubjects();

      renderRanges();

      renderLinks();

      updateMobileTabsVisibility();

      lucide.createIcons();

    }



    function getContextFolders() {

      if (globalStore.state.currentDashboardContext === 'personal') {

        return state.folders || [];

      } else {

        if (!state.groupFolders) state.groupFolders = {};

        if (!state.groupFolders[globalStore.state.currentDashboardContext]) {

          state.groupFolders[globalStore.state.currentDashboardContext] = { folders: [], activeFolderId: null };

        }

        return state.groupFolders[globalStore.state.currentDashboardContext].folders || [];

      }

    }



    function getContextActiveFolderId() {

      if (globalStore.state.currentDashboardContext === 'personal') return state.activeFolderId;

      return state.groupFolders?.[globalStore.state.currentDashboardContext]?.activeFolderId || null;

    }



    function setContextActiveFolderId(id) {

      if (globalStore.state.currentDashboardContext === 'personal') {

        state.activeFolderId = id;

      } else {

        if (!state.groupFolders) state.groupFolders = {};

        if (!state.groupFolders[globalStore.state.currentDashboardContext]) {

          state.groupFolders[globalStore.state.currentDashboardContext] = { folders: [], activeFolderId: null };

        }

        state.groupFolders[globalStore.state.currentDashboardContext].activeFolderId = id;

      }

      saveState();

    }



    function renderFolderBar() {

      const container = document.getElementById('folderSelectorBar');

      if (!container) return;



      const contextFolders = getContextFolders();

      const activeId = getContextActiveFolderId();



      if (contextFolders.length === 0) {

        container.innerHTML = `

          <button onclick="promptCreateFolderModal()" class="w-full hh-btn-primary px-3 py-2 text-xs flex items-center justify-center gap-1.5 shadow-sm">

            <i data-lucide="folder-plus" class="w-4 h-4"></i>

            <span>建立第一個專案資料夾</span>

          </button>

        `;

        lucide.createIcons({ props: { searchTarget: container } });

        return;

      }



      let options = contextFolders.map(f => `<option value="${f.id}" ${f.id === activeId ? 'selected' : ''}>${escapeHtml(f.name)}</option>`).join('');



      container.innerHTML = `

        <div class="relative flex-1">

          <select id="folderSelect" class="w-full hh-input px-2.5 py-1.5 text-xs font-bold rounded-lg cursor-pointer shadow-sm pr-7 bg-(--hh-accent-ice) truncate">

            ${options}

          </select>

        </div>

        <div class="flex items-center gap-1 shrink-0">

          <button onclick="promptCreateFolderModal()" class="hh-btn-secondary p-1.5 rounded-lg text-(--hh-headline)" title="新增專案">

            <i data-lucide="plus" class="w-4 h-4"></i>

          </button>

          <button onclick="promptEditFolderModal()" class="hh-btn-secondary p-1.5 rounded-lg text-(--hh-paragraph)" title="編輯專案">

            <i data-lucide="edit-3" class="w-4 h-4"></i>

          </button>

          <button onclick="promptDeleteFolderModal()" class="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 border border-transparent transition" title="刪除專案">

            <i data-lucide="trash-2" class="w-4 h-4"></i>

          </button>

        </div>

      `;



      document.getElementById('folderSelect').addEventListener('change', (e) => {

        setContextActiveFolderId(e.target.value);

        renderAll(); // 樂觀 UI：瞬間切換顯示本地快取

        if (supabaseClient) loadDashboardData(); // 背景更新雲端數據

      });



      lucide.createIcons({ props: { searchTarget: container } });

    }



    function promptCreateFolderModal() {

      openModal({

        title: '新增專案資料夾',

        icon: 'folder-plus',

        contentHtml: `

          <div class="space-y-4">

            <div>

              <label class="block text-xs font-black hh-headline mb-1.5">專案名稱</label>

              <input type="text" id="inputFolderName" placeholder="例如: 113學測備考, 大一課程" required class="w-full px-3.5 py-2 text-xs font-bold hh-input">

            </div>

            <div>

              <label class="block text-xs font-black hh-headline mb-1.5">預設學制模式 (決定初始科目)</label>

              <select id="selectFolderMode" class="w-full hh-input px-3 py-2 text-xs font-bold bg-(--hh-accent-ice) cursor-pointer">

                <option value="junior">🎒 國中模式 (含10科)</option>

                <option value="senior" selected>🏫 高中模式 (含10科)</option>

                <option value="vocational">🛠️ 高職模式 (含5科)</option>

                <option value="university">🎓 大學模式 (無科目)</option>

                <option value="blank">📄 空白模式 (無科目)</option>

              </select>

            </div>

          </div>

        `,

        confirmText: '建立專案',

        onConfirm: () => {

          const name = document.getElementById('inputFolderName').value.trim();

          const mode = document.getElementById('selectFolderMode').value;

          if (!name) {

            showToast('請輸入專案名稱', 'danger');

            return;

          }

          const folderId = generateId('folder');

          const presetObj = PRESET_MODES[mode];

          let initSubjects = [];



          if (presetObj && presetObj.subjects) {

            initSubjects = presetObj.subjects.map((s, idx) => ({

              id: `sub_${folderId}_${Date.now()}_${idx}`,

              name: s.name,

              preset_mode: folderId,

              ranges: []

            }));

          }



          const contextFolders = getContextFolders();

          const newFolder = {

            id: folderId,

            name: name,

            preset_mode: mode,

            subjects: initSubjects

          };

          contextFolders.push(newFolder);

          setContextActiveFolderId(folderId);



          renderAll();

          closeModal();

          showToast(`已建立專案「${name}」`, 'success');



          if (supabaseClient) {

            syncFolderSubjectsToCloud(newFolder);

            loadDashboardData();

          }

        }

      });

    }



    function promptEditFolderModal() {

      const activeFolderId = getContextActiveFolderId();

      const contextFolders = getContextFolders();

      const activeFolder = contextFolders.find(f => f.id === activeFolderId);

      if (!activeFolder) return;

      openModal({

        title: '重新命名專案',

        icon: 'edit-3',

        contentHtml: `

          <div>

            <label class="block text-xs font-black hh-headline mb-1.5">專案名稱</label>

            <input type="text" id="inputEditFolderName" value="${escapeHtml(activeFolder.name)}" required class="w-full px-3.5 py-2 text-xs font-bold hh-input">

          </div>

        `,

        confirmText: '儲存',

        onConfirm: () => {

          const val = document.getElementById('inputEditFolderName').value.trim();

          if (val) {

            const folder = contextFolders.find(f => f.id === activeFolder.id);

            if (folder) folder.name = val;

            saveState();



            if (supabaseClient && globalStore.state.currentDashboardContext !== 'personal') {

              syncFolderSubjectsToCloud(folder, true);

            }

            renderAll();

            showToast('專案名稱已更新', 'success');

          }

          closeModal();

        }

      });

    }



    function promptDeleteFolderModal() {

      const activeFolderId = getContextActiveFolderId();

      const contextFolders = getContextFolders();

      const activeFolder = contextFolders.find(f => f.id === activeFolderId);

      if (!activeFolder) return;

      openModal({

        title: '刪除專案確認',

        icon: 'alert-triangle',

        confirmClass: 'hh-btn-primary !bg-rose-500 !text-white',

        confirmText: '確認刪除',

        contentHtml: `

          <p class="text-xs font-bold">

            確定要刪除專案 <strong class="text-rose-600">「${escapeHtml(activeFolder.name)}」</strong> 嗎？<br>

            <span class="opacity-75 text-[11px]">這將一併刪除該專案內的所有科目與資料，且無法還原！</span>

          </p>

        `,

        onConfirm: async () => {

          if (globalStore.state.currentDashboardContext === 'personal') {

            state.folders = contextFolders.filter(f => f.id !== activeFolder.id);

            state.activeFolderId = state.folders.length > 0 ? state.folders[0].id : null;

          } else {

            if (state.groupFolders && state.groupFolders[globalStore.state.currentDashboardContext]) {

              state.groupFolders[globalStore.state.currentDashboardContext].folders = contextFolders.filter(f => f.id !== activeFolder.id);

              state.groupFolders[globalStore.state.currentDashboardContext].activeFolderId = state.groupFolders[globalStore.state.currentDashboardContext].folders.length > 0

                ? state.groupFolders[globalStore.state.currentDashboardContext].folders[0].id : null;

            }

          }

          saveState();



          if (supabaseClient) {

            let delQuery = supabaseClient.from('subjects').delete().eq('preset_mode', activeFolder.id);

            if (globalStore.state.currentDashboardContext === 'personal') {

              delQuery = delQuery.eq('user_id', globalStore.state.currentUser.id).is('group_id', null);

            } else {

              delQuery = delQuery.eq('group_id', globalStore.state.currentDashboardContext);

            }

            delQuery.then(() => {

              loadDashboardData();

            });

          }

          renderAll();

          closeModal();

          showToast('已刪除專案資料夾', 'info');

        }

      });

    }



    function renderPresetModeBadge() {

      // 按鈕已從 UI 中移除，此函數保留為擴充用

    }



    // Column 1: Subjects

    function renderSubjects() {

      const container = document.getElementById('subjectList');

      container.innerHTML = '';

      const btnAddSubject = document.getElementById('btnAddSubject');

      const btnImportPersonalData = document.getElementById('btnImportPersonalData');



      if (btnImportPersonalData) {

        const isGroupOwner = globalStore.state.currentDashboardContext !== 'personal' && globalStore.state.myGroups.some(g => g.id === globalStore.state.currentDashboardContext && g.owner_id === globalStore.state.currentUser?.id);

        if (isGroupOwner) {

          btnImportPersonalData.style.display = 'flex';

          btnImportPersonalData.classList.remove('hidden');

        } else {

          btnImportPersonalData.style.display = 'none';

          btnImportPersonalData.classList.add('hidden');

        }

      }



      if (globalStore.state.currentDashboardContext === 'personal' && state.folders.length === 0) {

        if (btnAddSubject) btnAddSubject.style.display = 'none';

        container.innerHTML = `

          <div class="text-center py-8 px-4 text-(--hh-paragraph) opacity-80 flex flex-col items-center justify-center h-full">

            <i data-lucide="folder-open" class="w-10 h-10 mx-auto mb-3 opacity-60"></i>

            <h3 class="text-sm font-black mb-1">尚無專案資料夾</h3>

            <p class="text-[11px] font-semibold mb-4 opacity-75">請建立第一個專案以開始管理學習資料</p>

            <button onclick="promptCreateFolderModal()" class="hh-btn-primary px-4 py-2 text-xs flex items-center gap-1.5">

              <i data-lucide="folder-plus" class="w-4 h-4"></i>

              <span>新增專案資料夾</span>

            </button>

          </div>

        `;

        lucide.createIcons({ props: { searchTarget: container } });

        return;

      }



      if (btnAddSubject) btnAddSubject.style.display = 'flex';



      let visibleSubjects = getFilteredSubjects();
      visibleSubjects = sortItems(visibleSubjects, 'subjects');

      if (visibleSubjects.length === 0) {

        container.innerHTML = `

          <div class="text-center py-8 px-4 text-(--hh-paragraph) opacity-60">

            <i data-lucide="book-open-check" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>

            <p class="text-xs font-bold">尚無科目資料<br>點擊上方按鈕新增</p>

          </div>

        `;

        return;

      }



      visibleSubjects.forEach(sub => {

        const isActive = sub.id === state.activeSubjectId;

        const totalRanges = sub.ranges ? sub.ranges.length : 0;



        const item = document.createElement('div');

        item.className = `group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-150 border-2 ${isActive

          ? 'hh-card-active font-black border-(--hh-card-border)'

          : 'bg-(--hh-card) border-(--hh-card-border) hover:border-(--hh-card-hover-border)'

          }`;



        item.onclick = (e) => {

          if (e.target.closest('.btn-delete-subject')) return;

          state.activeSubjectId = sub.id;

          state.activeRangeId = sub.ranges && sub.ranges.length > 0 ? sub.ranges[0].id : null;

          saveState();

          renderAll();

        };



        item.innerHTML = `

          <div class="flex items-center gap-2.5 overflow-hidden">

            <i data-lucide="folder" class="w-4 h-4 text-(--hh-headline) shrink-0"></i>

            <span class="text-xs font-bold hh-headline truncate">${escapeHtml(sub.name)}</span>

          </div>

          <div class="flex items-center gap-2 shrink-0">

            <span class="hh-badge px-2 py-0.5 text-[10px] rounded-full">

              ${totalRanges} 範圍

            </span>

            <button class="btn-edit-subject p-1.5 text-slate-400 hover:text-(--hh-btn-main) rounded-lg hover:bg-(--hh-accent-ice) border border-transparent hover:border-(--hh-card-border) transition" title="編輯科目">

              <i data-lucide="pencil" class="w-3.5 h-3.5"></i>

            </button>

            <button class="btn-delete-subject p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 border border-transparent hover:border-rose-300 transition" title="刪除科目">

              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>

            </button>

          </div>

        `;



        item.querySelector('.btn-edit-subject').onclick = (e) => {

          e.stopPropagation();

          promptEditSubject(sub);

        };



        item.querySelector('.btn-delete-subject').onclick = (e) => {

          e.stopPropagation();

          promptDeleteSubject(sub);

        };



        container.appendChild(item);

      });

    }



    // Column 2: Ranges

    function renderRanges() {

      const container = document.getElementById('rangeList');

      const btnAddRange = document.getElementById('btnAddRange');

      container.innerHTML = '';



      const activeSubject = getActiveSubject();



      if (!activeSubject) {

        btnAddRange.disabled = true;

        container.innerHTML = `

          <div class="text-center py-8 px-4 text-(--hh-paragraph) opacity-60">

            <i data-lucide="arrow-left-circle" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>

            <p class="text-xs font-bold">請先選取左側科目</p>

          </div>

        `;

        return;

      }



      btnAddRange.disabled = false;



      if (!activeSubject.ranges || activeSubject.ranges.length === 0) {

        container.innerHTML = `

          <div class="text-center py-8 px-4 text-(--hh-paragraph) opacity-60">

            <i data-lucide="bookmark-plus" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>

            <p class="text-xs font-bold">「${escapeHtml(activeSubject.name)}」尚無單元範圍<br>點擊上方按鈕新增</p>

          </div>

        `;

        return;

      }



      const sortedRanges = sortItems(activeSubject.ranges, 'ranges');
      sortedRanges.forEach(rng => {

        const isActive = rng.id === state.activeRangeId;

        const totalLinks = rng.links ? rng.links.length : 0;



        const item = document.createElement('div');

        item.className = `group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-150 border-2 ${isActive

          ? 'hh-card-active font-black border-(--hh-card-border)'

          : 'bg-(--hh-card) border-(--hh-card-border) hover:border-(--hh-card-hover-border)'

          }`;



        item.onclick = (e) => {

          if (e.target.closest('.btn-delete-range')) return;

          state.activeRangeId = rng.id;

          saveState();

          renderAll();

          if (window.innerWidth <= 1024) {

            globalStore.state.currentMobileTab = 'links';

            updateMobileTabsVisibility();

          }

        };



        item.innerHTML = `

          <div class="flex items-center gap-2.5 overflow-hidden">

            <i data-lucide="bookmark" class="w-4 h-4 text-(--hh-headline) shrink-0"></i>

            <span class="text-xs font-bold hh-headline truncate">${escapeHtml(rng.name)}</span>

          </div>

          <div class="flex items-center gap-2 shrink-0">

            <span class="hh-badge px-2 py-0.5 text-[10px] rounded-full">

              ${totalLinks} 連結

            </span>

            <button class="btn-edit-range p-1.5 text-slate-400 hover:text-(--hh-btn-main) rounded-lg hover:bg-(--hh-accent-ice) border border-transparent hover:border-(--hh-card-border) transition" title="編輯範圍">

              <i data-lucide="pencil" class="w-3.5 h-3.5"></i>

            </button>

            <button class="btn-delete-range p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 border border-transparent hover:border-rose-300 transition" title="刪除範圍">

              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>

            </button>

          </div>

        `;



        item.querySelector('.btn-edit-range').onclick = (e) => {

          e.stopPropagation();

          promptEditRange(rng);

        };



        item.querySelector('.btn-delete-range').onclick = (e) => {

          e.stopPropagation();

          promptDeleteRange(rng);

        };



        container.appendChild(item);

      });

    }



    // Column 3: Links

    function renderLinks() {

      const container = document.getElementById('linkList');

      const breadcrumb = document.getElementById('breadcrumbNav');

      const titleEl = document.getElementById('currentRangeTitle');

      const badgeEl = document.getElementById('linkCountBadge');

      const addFormCard = document.getElementById('addLinkFormCard');



      container.innerHTML = '';



      const activeSubject = getActiveSubject();

      const activeRange = getActiveRange();



      if (!activeSubject || !activeRange) {

        breadcrumb.innerHTML = `<span>未選取狀態</span>`;

        titleEl.innerHTML = `<span class="opacity-60">請先選取學習單元範圍</span>`;

        badgeEl.textContent = `0 個連結`;

        addFormCard.classList.add('hidden');



        container.innerHTML = `

          <div class="h-64 flex flex-col items-center justify-center text-center p-6 text-(--hh-paragraph) opacity-70">

            <div class="w-14 h-14 rounded-2xl bg-(--hh-accent-ice) border-2 border-(--hh-card-border) flex items-center justify-center mb-3">

              <i data-lucide="mouse-pointer-click" class="w-7 h-7 hh-headline"></i>

            </div>

            <h4 class="text-sm font-black hh-headline mb-1">未選擇學習範圍</h4>

            <p class="text-xs font-semibold max-w-xs">請點選科目與單元範圍以展開並管理相關的複習連結。</p>

          </div>

        `;

        return;

      }



      breadcrumb.innerHTML = `

        <span class="font-extrabold text-(--hh-headline)">${escapeHtml(activeSubject.name)}</span>

        <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>

        <span class="font-bold text-(--hh-paragraph)">${escapeHtml(activeRange.name)}</span>

      `;



      titleEl.innerHTML = `<span>${escapeHtml(activeRange.name)}</span>`;



      let links = activeRange.links || [];
      links = sortItems(links, 'links');

      badgeEl.textContent = `${links.length} 個連結`;

      addFormCard.classList.remove('hidden');



      if (links.length === 0) {

        container.innerHTML = `

          <div class="h-48 flex flex-col items-center justify-center text-center p-6 rounded-xl border-2 border-dashed border-(--hh-card-border) bg-(--hh-card) text-(--hh-paragraph) opacity-80">

            <i data-lucide="external-link" class="w-7 h-7 mb-2 opacity-50"></i>

            <p class="text-xs font-bold">該單元內尚無連結，請使用上方表單新增講義或影片網址。</p>

          </div>

        `;

        return;

      }



      links.forEach(lnk => {

        const card = document.createElement('div');

        card.className = 'hh-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group';



        const safeUrl = escapeHtml(lnk.url);



        card.innerHTML = `

          <div class="flex items-start gap-3 overflow-hidden">

            <div class="w-10 h-10 rounded-xl bg-(--hh-accent-ice) border-2 border-(--hh-card-border) flex items-center justify-center text-(--hh-headline) shrink-0 mt-0.5 sm:mt-0 shadow-xs">

              <i data-lucide="globe" class="w-5 h-5"></i>

            </div>

            <div class="overflow-hidden">

              <h5 class="text-sm font-black hh-headline truncate">

                ${escapeHtml(lnk.title)}

              </h5>

              <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="text-xs font-bold text-(--hh-paragraph) opacity-80 hover:opacity-100 transition-opacity truncate block flex items-center gap-1 mt-0.5">

                <span class="truncate">${safeUrl}</span>

                <i data-lucide="external-link" class="w-3.5 h-3.5 shrink-0"></i>

              </a>

              ${(lnk.editor || lnk.creator) ? `

              <div class="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-(--hh-card-border)/10 text-[10px] font-bold text-(--hh-paragraph) opacity-70">

                <img src="${escapeHtml((lnk.editor || lnk.creator).avatar_url || 'https://api.dicebear.com/7.x/notionists/svg?seed=' + (lnk.editor || lnk.creator).nickname)}" class="w-4 h-4 rounded-full border border-(--hh-card-border) object-cover bg-white">

                <span>最後編輯: ${escapeHtml((lnk.editor || lnk.creator).nickname)}</span>

              </div>

              ` : ''}

            </div>

          </div>



          <div class="flex items-center gap-2 shrink-0 self-end sm:self-center pt-2 sm:pt-0 border-t-2 sm:border-t-0 border-(--hh-card-border)/20 w-full sm:w-auto justify-end">

            <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="hh-btn-primary px-3 py-1.5 text-xs flex items-center gap-1">

              <i data-lucide="external-link" class="w-3.5 h-3.5"></i>

              <span>開啟</span>

            </a>



            <button class="btn-copy-link hh-btn-secondary px-3 py-1.5 text-xs flex items-center gap-1" title="複製連結網址">

              <i data-lucide="copy" class="w-3.5 h-3.5"></i>

              <span>複製</span>

            </button>



            <button class="btn-edit-link hh-btn-secondary px-3 py-1.5 text-xs flex items-center gap-1" title="編輯連結">

              <i data-lucide="pencil" class="w-3.5 h-3.5"></i>

              <span>編輯</span>

            </button>



            <button class="btn-delete-link p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 border border-transparent hover:border-rose-300 transition" title="刪除連結">

              <i data-lucide="trash-2" class="w-4 h-4"></i>

            </button>

          </div>

        `;



        card.querySelector('.btn-copy-link').onclick = () => {

          navigator.clipboard.writeText(lnk.url).then(() => {

            showToast('已成功複製網址至剪貼簿！', 'success');

          }).catch(err => {

            showToast('複製失敗', 'danger');

          });

        };



        card.querySelector('.btn-edit-link').onclick = () => {

          promptEditLink(lnk);

        };



        card.querySelector('.btn-delete-link').onclick = () => {

          promptDeleteLink(lnk);

        };



        container.appendChild(card);

      });

    }



    // --- Action Handlers & Dialog Prompts ---



    function promptAddSubject() {

      openModal({

        title: '新增學習科目',

        icon: 'folder-plus',

        contentHtml: `

          <div>

            <label class="block text-xs font-black hh-headline mb-1.5">科目名稱</label>

            <input type="text" id="modalInputSubject" placeholder="例如: 國文, 物理, 程式設計" class="w-full px-3.5 py-2 text-xs font-bold hh-input">

          </div>

        `,

        confirmText: '建立科目',

        onConfirm: async () => {

          const input = document.getElementById('modalInputSubject');

          const val = input ? input.value.trim() : '';

          if (!val) {

            showToast('請輸入有效的科目名稱', 'danger');

            return;

          }



          if (supabaseClient && globalStore.state.currentUser) {

            const activeFolderId = getContextActiveFolderId();

            const insertPayload = globalStore.state.currentDashboardContext === 'personal'

              ? { name: val, user_id: globalStore.state.currentUser.id, group_id: null, preset_mode: activeFolderId }

              : { name: val, user_id: null, group_id: globalStore.state.currentDashboardContext, preset_mode: activeFolderId };



            const { data: newSub, error } = await supabaseClient.from('subjects').insert(insertPayload).select().single();

            if (error) {

              showToast('新增科目失敗: ' + error.message, 'danger');

              return;

            }

            const activeFolder = getActiveFolder();

            if (activeFolder) {

              activeFolder.subjects.push({ id: newSub.id, name: newSub.name, preset_mode: newSub.preset_mode, ranges: [] });

            }

            state.activeSubjectId = newSub.id;

            state.activeRangeId = null;

          } else {

            const activeFolderId = getContextActiveFolderId();

            const newSub = {

              id: generateId('sub'),

              name: val,

              preset_mode: activeFolderId,

              ranges: []

            };

            const activeFolder = getActiveFolder();

            if (activeFolder) activeFolder.subjects.push(newSub);



            state.activeSubjectId = newSub.id;

            state.activeRangeId = null;

            saveState();

          }



          renderAll();

          closeModal();

          showToast(`已建立科目「${val}」`, 'success');

        }

      });

    }



    function promptDeleteSubject(sub) {

      openModal({

        title: '刪除科目確認',

        icon: 'alert-triangle',

        confirmClass: 'hh-btn-primary !bg-rose-500 !text-white',

        confirmText: '確認刪除',

        contentHtml: `

          <p class="text-xs font-bold">

            確定要刪除科目 <strong class="text-rose-600">「${escapeHtml(sub.name)}」</strong> 嗎？<br>

            <span class="opacity-75 text-[11px]">這將一併刪除該科目內的所有單元範圍與學習連結！</span>

          </p>

        `,

        onConfirm: async () => {

          if (supabaseClient && globalStore.state.currentUser) {

            const { error } = await supabaseClient.from('subjects').delete().eq('id', sub.id);

            if (error) {

              showToast('刪除科目失敗: ' + error.message, 'danger');

              return;

            }

          }

          const activeFolder = getActiveFolder();

          if (activeFolder) activeFolder.subjects = activeFolder.subjects.filter(s => s.id !== sub.id);

          saveState();



          validateStateDefensive();

          renderAll();

          closeModal();

          showToast(`已刪除科目「${sub.name}」`, 'info');

        }

      });

    }



    function promptEditSubject(sub) {

      openModal({

        title: '編輯學習科目',

        icon: 'pencil',

        contentHtml: `

          <div>

            <label class="block text-xs font-black hh-headline mb-1.5">科目名稱</label>

            <input type="text" id="modalInputEditSubject" value="${escapeHtml(sub.name)}" class="w-full px-3.5 py-2 text-xs font-bold hh-input">

          </div>

        `,

        confirmText: '儲存變更',

        onConfirm: async () => {

          const input = document.getElementById('modalInputEditSubject');

          const val = input ? input.value.trim() : '';

          if (!val) {

            showToast('請輸入有效的科目名稱', 'danger');

            return;

          }

          if (supabaseClient && globalStore.state.currentUser) {

            const { error } = await supabaseClient.from('subjects').update({ name: val }).eq('id', sub.id);

            if (error) {

              showToast('編輯科目失敗: ' + error.message, 'danger');

              return;

            }

            sub.name = val;

          } else {

            sub.name = val;

            saveState();

          }

          renderAll();

          closeModal();

          showToast('科目已更新', 'success');

        }

      });

    }



    function promptAddRange() {

      const activeSubject = getActiveSubject();

      if (!activeSubject) return;



      openModal({

        title: `新增單元範圍 (${activeSubject.name})`,

        icon: 'bookmark-plus',

        contentHtml: `

          <div>

            <label class="block text-xs font-black hh-headline mb-1.5">單元範圍名稱</label>

            <input type="text" id="modalInputRange" placeholder="例如: 第一章 基礎概念, B1 物質的組成" class="w-full px-3.5 py-2 text-xs font-bold hh-input">

          </div>

        `,

        confirmText: '建立單元',

        onConfirm: async () => {

          const input = document.getElementById('modalInputRange');

          const val = input ? input.value.trim() : '';

          if (!val) {

            showToast('請輸入有效的單元名稱', 'danger');

            return;

          }



          if (supabaseClient && globalStore.state.currentUser) {

            const { data: newRng, error } = await supabaseClient.from('ranges').insert({

              subject_id: activeSubject.id,

              name: val

            }).select().single();



            if (error) {

              showToast('新增單元失敗: ' + error.message, 'danger');

              return;

            }

            if (!activeSubject.ranges) activeSubject.ranges = [];

            activeSubject.ranges.push({ id: newRng.id, name: newRng.name, links: [] });

            state.activeRangeId = newRng.id;

          } else {

            const newRange = {

              id: generateId('rng'),

              name: val,

              links: []

            };

            if (!activeSubject.ranges) activeSubject.ranges = [];

            activeSubject.ranges.push(newRange);

            state.activeRangeId = newRange.id;

            saveState();

          }



          renderAll();

          closeModal();

          showToast(`已新增單元範圍「${val}」`, 'success');

        }

      });

    }



    function promptDeleteRange(rng) {

      const activeSub = getActiveSubject();

      openModal({

        title: '刪除單元範圍確認',

        icon: 'alert-triangle',

        confirmClass: 'hh-btn-primary !bg-rose-500 !text-white',

        confirmText: '確認刪除',

        contentHtml: `

          <p class="text-xs font-bold">

            確定要刪除單元範圍 <strong class="text-rose-600">「${escapeHtml(rng.name)}」</strong> 嗎？<br>

            <span class="opacity-75 text-[11px]">該單元內的所有學習連結將一併刪除。</span>

          </p>

        `,

        onConfirm: async () => {

          if (supabaseClient && globalStore.state.currentUser) {

            const { error } = await supabaseClient.from('ranges').delete().eq('id', rng.id);

            if (error) {

              showToast('刪除單元失敗: ' + error.message, 'danger');

              return;

            }

            if (activeSub && activeSub.ranges) {

              activeSub.ranges = activeSub.ranges.filter(r => r.id !== rng.id);

            }

          } else {

            if (activeSub && activeSub.ranges) {

              activeSub.ranges = activeSub.ranges.filter(r => r.id !== rng.id);

            }

            saveState();

          }



          if (state.activeRangeId === rng.id) {

            state.activeRangeId = (activeSub && activeSub.ranges && activeSub.ranges.length > 0) ? activeSub.ranges[0].id : null;

          }

          renderAll();

          closeModal();

          showToast(`已刪除單元範圍「${rng.name}」`, 'info');

        }

      });

    }



    function promptEditRange(rng) {

      openModal({

        title: '編輯單元範圍',

        icon: 'pencil',

        contentHtml: `

          <div>

            <label class="block text-xs font-black hh-headline mb-1.5">單元範圍名稱</label>

            <input type="text" id="modalInputEditRange" value="${escapeHtml(rng.name)}" class="w-full px-3.5 py-2 text-xs font-bold hh-input">

          </div>

        `,

        confirmText: '儲存變更',

        onConfirm: async () => {

          const input = document.getElementById('modalInputEditRange');

          const val = input ? input.value.trim() : '';

          if (!val) {

            showToast('請輸入有效的單元名稱', 'danger');

            return;

          }

          if (supabaseClient && globalStore.state.currentUser) {

            const { error } = await supabaseClient.from('ranges').update({ name: val }).eq('id', rng.id);

            if (error) {

              showToast('編輯單元失敗: ' + error.message, 'danger');

              return;

            }

            rng.name = val;

          } else {

            rng.name = val;

            saveState();

          }

          renderAll();

          closeModal();

          showToast('單元範圍已更新', 'success');

        }

      });

    }



    async function handleAddLink(e) {

      e.preventDefault();

      const titleInput = document.getElementById('linkTitleInput');

      const urlInput = document.getElementById('linkUrlInput');



      const title = titleInput.value.trim();

      const rawUrl = urlInput.value.trim();



      if (!title || !rawUrl) {

        showToast('請完整填寫連結名稱與網址', 'danger');

        return;

      }



      const activeRange = getActiveRange();

      if (!activeRange) {

        showToast('請先選取有效的單元範圍', 'danger');

        return;

      }



      const normalized = normalizeUrl(rawUrl);



      if (supabaseClient && globalStore.state.currentUser) {

        const { data: newLnk, error } = await supabaseClient.from('resource_links').insert({

          range_id: activeRange.id,

          title: title,

          url: normalized,

          created_by: globalStore.state.currentUser.id,

          last_edited_by: globalStore.state.currentUser.id,

          last_edited_at: new Date().toISOString()

        }).select('*, creator:profiles!resource_links_created_by_fkey(nickname, avatar_url), editor:profiles!fk_resource_links_last_editor(nickname, avatar_url)').single();



        if (error) {

          showToast('新增連結失敗: ' + error.message, 'danger');

          return;

        }



        if (!activeRange.links) activeRange.links = [];

        activeRange.links.push({

          id: newLnk.id,

          title: newLnk.title,

          url: newLnk.url,

          created_by: newLnk.created_by,

          last_edited_by: newLnk.last_edited_by,

          last_edited_at: newLnk.last_edited_at,

          editor: newLnk.editor || null,

          creator: newLnk.creator || null

        });

      } else {

        const newLink = {

          id: generateId('lnk'),

          title: title,

          url: normalized

        };



        if (!activeRange.links) activeRange.links = [];

        activeRange.links.push(newLink);

        saveState();

      }



      renderAll();



      titleInput.value = '';

      urlInput.value = '';

      showToast(`已新增學習連結「${title}」`, 'success');

    }



    function promptDeleteLink(lnk) {

      const activeRange = getActiveRange();

      openModal({

        title: '刪除連結確認',

        icon: 'alert-triangle',

        confirmClass: 'hh-btn-primary !bg-rose-500 !text-white',

        confirmText: '刪除連結',

        contentHtml: `

          <p class="text-xs font-bold">

            確定要刪除學習連結 <strong class="text-rose-600">「${escapeHtml(lnk.title)}」</strong> 嗎？

          </p>

        `,

        onConfirm: async () => {

          if (supabaseClient && globalStore.state.currentUser) {

            const { error } = await supabaseClient.from('resource_links').delete().eq('id', lnk.id);

            if (error) {

              showToast('刪除連結失敗: ' + error.message, 'danger');

              return;

            }

            if (activeRange && activeRange.links) {

              activeRange.links = activeRange.links.filter(l => l.id !== lnk.id);

            }

          } else {

            if (activeRange && activeRange.links) {

              activeRange.links = activeRange.links.filter(l => l.id !== lnk.id);

            }

            saveState();

          }



          renderAll();

          closeModal();

          showToast('已刪除學習連結', 'info');

        }

      });

    }



    function promptEditLink(lnk) {

      openModal({

        title: '編輯學習連結',

        icon: 'pencil',

        contentHtml: `

          <div class="space-y-3">

            <div>

              <label class="block text-xs font-black hh-headline mb-1.5">連結名稱</label>

              <input type="text" id="modalInputEditLinkTitle" value="${escapeHtml(lnk.title)}" class="w-full px-3.5 py-2 text-xs font-bold hh-input">

            </div>

            <div>

              <label class="block text-xs font-black hh-headline mb-1.5">網址</label>

              <input type="text" id="modalInputEditLinkUrl" value="${escapeHtml(lnk.url)}" class="w-full px-3.5 py-2 text-xs font-bold hh-input">

            </div>

          </div>

        `,

        confirmText: '儲存變更',

        onConfirm: async () => {

          const title = document.getElementById('modalInputEditLinkTitle').value.trim();

          const rawUrl = document.getElementById('modalInputEditLinkUrl').value.trim();

          if (!title || !rawUrl) {

            showToast('請完整填寫連結名稱與網址', 'danger');

            return;

          }

          const normalized = normalizeUrl(rawUrl);



          if (supabaseClient && globalStore.state.currentUser) {

            const { error } = await supabaseClient.from('resource_links').update({ title: title, url: normalized, last_edited_by: globalStore.state.currentUser.id, last_edited_at: new Date().toISOString() }).eq('id', lnk.id);

            if (error) {

              showToast('編輯連結失敗: ' + error.message, 'danger');

              return;

            }

            lnk.title = title;

            lnk.url = normalized;

            lnk.last_edited_by = globalStore.state.currentUser.id;

            lnk.last_edited_at = new Date().toISOString();

            lnk.editor = { nickname: globalStore.state.currentUser.nickname, avatar_url: globalStore.state.currentUser.avatarUrl };

          } else {

            lnk.title = title;

            lnk.url = normalized;

            saveState();

          }

          renderAll();

          closeModal();

          showToast('學習連結已更新', 'success');

        }

      });

    }



    // --- Mobile / iPad Navigation Tabs ---



    function setMobileTab(tabName) {

      globalStore.state.currentMobileTab = tabName;

      updateMobileTabsVisibility();

    }



    function updateMobileTabsVisibility() {

      const navBtn = document.getElementById('tabBtnNav');

      const linksBtn = document.getElementById('tabBtnLinks');

      const navWrapper = document.getElementById('navColumnsWrapper');

      const linksWrapper = document.getElementById('linksColumnWrapper');



      const isCompactView = (window.innerWidth <= 1024);



      if (!isCompactView) {

        navWrapper.classList.remove('hidden');

        linksWrapper.classList.remove('hidden');

        return;

      }



      if (globalStore.state.currentMobileTab === 'nav') {

        navWrapper.classList.remove('hidden');

        linksWrapper.classList.add('hidden');



        navBtn.classList.add('bg-(--hh-btn-main)', 'text-(--hh-btn-text)', 'shadow-sm');

        navBtn.classList.remove('text-(--hh-paragraph)');



        linksBtn.classList.remove('bg-(--hh-btn-main)', 'text-(--hh-btn-text)', 'shadow-sm');

        linksBtn.classList.add('text-(--hh-paragraph)');

      } else {

        navWrapper.classList.add('hidden');

        linksWrapper.classList.remove('hidden');



        linksBtn.classList.add('bg-(--hh-btn-main)', 'text-(--hh-btn-text)', 'shadow-sm');

        linksBtn.classList.remove('text-(--hh-paragraph)');



        navBtn.classList.remove('bg-(--hh-btn-main)', 'text-(--hh-btn-text)', 'shadow-sm');

        navBtn.classList.add('text-(--hh-paragraph)');

      }

    }



    // --- Central Search System ---



    globalStore.state.currentSearchResults = [];

    let selectedResultIndex = -1;



    function openSearchModal() {

      const overlay = document.getElementById('searchModalOverlay');

      const card = document.getElementById('searchModalContent');

      const input = document.getElementById('searchInput');



      overlay.classList.remove('opacity-0', 'pointer-events-none');

      card.classList.remove('scale-95');

      card.classList.add('scale-100');



      input.value = '';

      document.getElementById('btnClearSearch').classList.add('hidden');

      performSearch('');



      setTimeout(() => input.focus(), 50);

    }



    function closeSearchModal() {

      const overlay = document.getElementById('searchModalOverlay');

      const card = document.getElementById('searchModalContent');



      overlay.classList.add('opacity-0', 'pointer-events-none');

      card.classList.remove('scale-100');

      card.classList.add('scale-95');

      selectedResultIndex = -1;

      globalStore.state.currentSearchResults = [];

    }



    function getAllSearchableSubjects() {

      const items = [];

      const contextFolders = getContextFolders();

      if (contextFolders && Array.isArray(contextFolders)) {

        contextFolders.forEach(folder => {

          if (folder.subjects && Array.isArray(folder.subjects)) {

            folder.subjects.forEach(sub => {

              items.push({

                ...sub,

                folderId: folder.id,

                folderName: folder.name

              });

            });

          }

        });

      }

      return items;

    }



    function performSearch(query) {

      const q = query.trim().toLowerCase();

      const btnClear = document.getElementById('btnClearSearch');

      const countEl = document.getElementById('searchResultCount');



      if (q) btnClear.classList.remove('hidden');

      else btnClear.classList.add('hidden');



      globalStore.state.currentSearchResults = [];

      const searchableSubjects = getAllSearchableSubjects();



      searchableSubjects.forEach(sub => {

        const isSubMatch = !q || sub.name.toLowerCase().includes(q);



        // 1. Subject match

        if (isSubMatch) {

          globalStore.state.currentSearchResults.push({

            type: 'subject',

            id: sub.id,

            subjectId: sub.id,

            folderId: sub.folderId,

            title: sub.name,

            subtitle: sub.folderName ? `科目 📍 ${sub.folderName}` : `科目`,

            icon: 'book-open'

          });

        }



        // 2. Range & Link match

        if (sub.ranges && Array.isArray(sub.ranges)) {

          sub.ranges.forEach(rng => {

            const isRngNameMatch = q ? rng.name.toLowerCase().includes(q) : false;

            const isRngMatch = !q || isRngNameMatch || (q && sub.name.toLowerCase().includes(q));



            if (isRngMatch) {

              const subPath = sub.folderName ? `${sub.folderName} > ${sub.name}` : sub.name;

              globalStore.state.currentSearchResults.push({

                type: 'range',

                id: rng.id,

                subjectId: sub.id,

                rangeId: rng.id,

                folderId: sub.folderId,

                title: rng.name,

                subtitle: `單元範圍 📍 ${subPath}`,

                icon: 'bookmark'

              });

            }



            if (rng.links && Array.isArray(rng.links)) {

              rng.links.forEach(lnk => {

                const isLnkTitleMatch = q ? (lnk.title || '').toLowerCase().includes(q) : false;

                const isLnkUrlMatch = q ? (lnk.url || '').toLowerCase().includes(q) : false;

                const isLnkMatch = !q || isLnkTitleMatch || isLnkUrlMatch || (q && (isRngNameMatch || sub.name.toLowerCase().includes(q)));



                if (isLnkMatch) {

                  const rngPath = sub.folderName ? `${sub.folderName} > ${sub.name} > ${rng.name}` : `${sub.name} > ${rng.name}`;

                  globalStore.state.currentSearchResults.push({

                    type: 'link',

                    id: lnk.id,

                    subjectId: sub.id,

                    rangeId: rng.id,

                    linkId: lnk.id,

                    folderId: sub.folderId,

                    title: lnk.title,

                    subtitle: `學習連結 📍 ${rngPath}`,

                    icon: 'external-link',

                    url: lnk.url

                  });

                }

              });

            }

          });

        }

      });



      countEl.textContent = `${globalStore.state.currentSearchResults.length} 筆結果`;

      selectedResultIndex = globalStore.state.currentSearchResults.length > 0 ? 0 : -1;

      renderSearchResults(globalStore.state.currentSearchResults, q);

    }



    function renderSearchResults(results, query) {

      const container = document.getElementById('searchResultsList');

      container.innerHTML = '';



      if (results.length === 0) {

        container.innerHTML = `

          <div class="text-center py-10 px-4 text-(--hh-paragraph) opacity-60">

            <i data-lucide="search-x" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>

            <p class="text-xs font-bold">找不到包含「${escapeHtml(query)}」的學習資料</p>

          </div>

        `;

        lucide.createIcons({ props: { searchTarget: container } });

        return;

      }



      results.forEach((res, index) => {

        const item = document.createElement('div');

        const isSelected = index === selectedResultIndex;



        let typeBadge = '';

        if (res.type === 'subject') {

          typeBadge = `<span class="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300">科目</span>`;

        } else if (res.type === 'range') {

          typeBadge = `<span class="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-sky-100 text-sky-800 border border-sky-300 dark:bg-sky-950 dark:text-sky-300">單元範圍</span>`;

        } else {

          typeBadge = `<span class="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-300">學習連結</span>`;

        }



        item.className = `search-result-item flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-150 border-2 ${isSelected

          ? 'hh-card-active border-(--hh-card-border) ring-2 ring-(--hh-btn-main)'

          : 'bg-(--hh-card) border-(--hh-card-border) hover:border-(--hh-card-hover-border)'

          }`;

        item.dataset.index = index;



        item.innerHTML = `

          <div class="flex items-center gap-3 overflow-hidden">

            <div class="w-9 h-9 rounded-xl bg-(--hh-accent-ice) border-2 border-(--hh-card-border) flex items-center justify-center shrink-0">

              <i data-lucide="${res.icon}" class="w-4 h-4 text-(--hh-headline)"></i>

            </div>

            <div class="overflow-hidden">

              <h5 class="text-xs font-black hh-headline truncate">${escapeHtml(res.title)}</h5>

              <p class="text-[11px] font-semibold text-(--hh-paragraph) opacity-80 truncate">${escapeHtml(res.subtitle)}</p>

            </div>

          </div>

          <div class="flex items-center gap-2 shrink-0 ml-2">

            ${typeBadge}

            <i data-lucide="corner-down-left" class="w-4 h-4 text-(--hh-paragraph) opacity-50"></i>

          </div>

        `;



        item.onclick = () => navigateToResult(res);

        item.onmouseenter = () => {

          selectedResultIndex = index;

          updateSearchResultHighlights();

        };



        container.appendChild(item);

      });



      lucide.createIcons({ props: { searchTarget: container } });

    }



    function updateSearchResultHighlights() {

      const items = document.querySelectorAll('.search-result-item');

      items.forEach((el, idx) => {

        if (idx === selectedResultIndex) {

          el.classList.add('hh-card-active', 'ring-2', 'ring-(--hh-btn-main)');

          el.classList.remove('bg-(--hh-card)');

          el.scrollIntoView({ block: 'nearest' });

        } else {

          el.classList.remove('hh-card-active', 'ring-2', 'ring-(--hh-btn-main)');

          el.classList.add('bg-(--hh-card)');

        }

      });

    }



    function navigateToResult(res) {

      if (!res) return;



      if (res.folderId && state.folders) {

        const folderExists = state.folders.some(f => f.id === res.folderId);

        if (folderExists) {

          setContextActiveFolderId(res.folderId);

        }

      }



      state.activeSubjectId = res.subjectId;

      if (res.rangeId) state.activeRangeId = res.rangeId;



      saveState();



      if (window.innerWidth <= 1024) {

        if (res.type === 'link' || res.type === 'range') globalStore.state.currentMobileTab = 'links';

        else globalStore.state.currentMobileTab = 'nav';

      }



      renderAll();

      closeSearchModal();



      const visibleSubjects = getFilteredSubjects();

      const subObj = visibleSubjects.find(s => s.id === res.subjectId);

      const subName = subObj ? subObj.name : '';

      const displayTitle = res.type === 'subject' ? subName : `${subName}${res.title ? ' > ' + res.title : ''}`;

      showToast(`已跳轉至：「${displayTitle}」`, 'success');

    }



    // --- DOM Event Listeners & Dashboard Context Event Routing ---



    document.addEventListener('DOMContentLoaded', () => {

      loadState();

      initSupabase();

      renderAll();



      // Dashboard Context Selection Event

      document.getElementById('dashboardContextSelect').addEventListener('change', async (e) => {

        const val = e.target.value;

        if (val === 'action_create_group') {

          e.target.value = globalStore.state.currentDashboardContext;

          promptCreateGroupModal();

        } else if (val === 'action_join_group') {

          e.target.value = globalStore.state.currentDashboardContext;

          promptJoinGroupModal();

        } else if (val === 'action_manage_groups') {

          e.target.value = globalStore.state.currentDashboardContext;

          promptManageGroupsModal();

        } else {

          globalStore.state.currentDashboardContext = val;

          if (val === 'personal') {

            showToast('已切換為：個人雲端 Dashboard', 'info');

          } else {

            const grp = globalStore.state.myGroups.find(g => g.id === val);

            showToast(`已切換為群組：「${grp ? grp.name : val}」 (全員平權共享模式)`, 'success');

          }

          await loadDashboardData();

          setupRealtimeSubscription();

        }

      });



      // Search Trigger & Modal Bindings

      document.getElementById('btnOpenSearch').addEventListener('click', openSearchModal);



      const searchInput = document.getElementById('searchInput');

      searchInput.addEventListener('input', (e) => performSearch(e.target.value));



      document.getElementById('btnClearSearch').addEventListener('click', () => {

        searchInput.value = '';

        performSearch('');

        searchInput.focus();

      });



      document.getElementById('searchModalOverlay').addEventListener('click', (e) => {

        if (e.target === document.getElementById('searchModalOverlay')) closeSearchModal();

      });



      // Keyboard Navigation

      document.addEventListener('keydown', (e) => {

        const searchOverlay = document.getElementById('searchModalOverlay');

        const isSearchOpen = searchOverlay && !searchOverlay.classList.contains('opacity-0');



        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {

          e.preventDefault();

          if (isSearchOpen) closeSearchModal();

          else openSearchModal();

          return;

        }



        if (isSearchOpen) {

          if (e.key === 'Escape') closeSearchModal();

          else if (e.key === 'ArrowDown') {

            e.preventDefault();

            if (globalStore.state.currentSearchResults.length > 0) {

              selectedResultIndex = (selectedResultIndex + 1) % globalStore.state.currentSearchResults.length;

              updateSearchResultHighlights();

            }

          } else if (e.key === 'ArrowUp') {

            e.preventDefault();

            if (globalStore.state.currentSearchResults.length > 0) {

              selectedResultIndex = (selectedResultIndex - 1 + globalStore.state.currentSearchResults.length) % globalStore.state.currentSearchResults.length;

              updateSearchResultHighlights();

            }

          } else if (e.key === 'Enter') {

            e.preventDefault();

            if (selectedResultIndex >= 0 && selectedResultIndex < globalStore.state.currentSearchResults.length) {

              navigateToResult(globalStore.state.currentSearchResults[selectedResultIndex]);

            }

          }

        } else if (e.key === 'Escape') {

          closeModal();

        }

      });



      // Theme Switcher Event

      const themeNamesMap = {

        'sage': '🌿 舒緩森林',

        'dusk': '🌙 柔和夜讀',

        'light': '☀️ 極簡明亮'

      };

      document.getElementById('themeSelector').addEventListener('change', (e) => {

        const val = e.target.value;

        setTheme(val);

        const label = themeNamesMap[val] || val;

        showToast(`已切換為：${label}`, 'info');

      });



      // iPad Portrait Tabs Event Controls

      document.getElementById('tabBtnNav').addEventListener('click', () => setMobileTab('nav'));

      document.getElementById('tabBtnLinks').addEventListener('click', () => setMobileTab('links'));



      // Window Resize Handler

      window.addEventListener('resize', updateMobileTabsVisibility);



      // Subject / Range Add Buttons

      document.getElementById('btnAddSubject').addEventListener('click', promptAddSubject);

      document.getElementById('btnImportPersonalData').addEventListener('click', promptImportPersonalDataModal);

      document.getElementById('btnAddRange').addEventListener('click', promptAddRange);



      // Link Form Submit

      document.getElementById('linkForm').addEventListener('submit', handleAddLink);



      // Modal Bindings

      document.getElementById('btnModalClose').addEventListener('click', closeModal);

      document.getElementById('btnModalCancel').addEventListener('click', closeModal);

      document.getElementById('btnModalConfirm').addEventListener('click', () => {

        if (modalConfirmCallback) modalConfirmCallback();

      });

      document.getElementById('modalOverlay').addEventListener('click', (e) => {

        if (e.target === document.getElementById('modalOverlay')) closeModal();

      });

    });

