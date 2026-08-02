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
        if (typeof val === 'object' && val !== null) {
          return self._createProxy(val, [...path, prop]);
        }
        if (typeof val === 'function' && Array.isArray(obj)) {
           return function(...args) {
               console.log('Array function called:', prop);
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

const store = new ReactiveStore({ myGroups: [1, 2] });
let count = 0;
store.subscribe('myGroups', () => {
  count++;
  if (count > 5) throw new Error('Infinite loop detected');
  console.log('Rendering...');
  store.state.myGroups.forEach(g => { /* do nothing */ });
});

try {
  store.notify('myGroups', store.state.myGroups);
} catch (err) {
  console.error(err.message);
}
