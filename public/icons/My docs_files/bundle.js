
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    /**
     * Creates an event dispatcher that can be used to dispatch [component events](/docs#template-syntax-component-directives-on-eventname).
     * Event dispatchers are functions that can take two arguments: `name` and `detail`.
     *
     * Component events created with `createEventDispatcher` create a
     * [CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent).
     * These events do not [bubble](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture).
     * The `detail` argument corresponds to the [CustomEvent.detail](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/detail)
     * property and can contain any type of data.
     *
     * https://svelte.dev/docs#run-time-svelte-createeventdispatcher
     */
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.53.1' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/components/LeftPannel.svelte generated by Svelte v3.53.1 */

    const file$9 = "src/components/LeftPannel.svelte";

    function create_fragment$a(ctx) {
    	let div5;
    	let div3;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let div0;
    	let h5;
    	let t2;
    	let img1;
    	let img1_src_value;
    	let t3;
    	let div1;
    	let img2;
    	let img2_src_value;
    	let t4;
    	let p0;
    	let t6;
    	let div2;
    	let img3;
    	let img3_src_value;
    	let t7;
    	let p1;
    	let t9;
    	let div4;
    	let img4;
    	let img4_src_value;
    	let t10;
    	let h4;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div3 = element("div");
    			img0 = element("img");
    			t0 = space();
    			div0 = element("div");
    			h5 = element("h5");
    			h5.textContent = "New Document";
    			t2 = space();
    			img1 = element("img");
    			t3 = space();
    			div1 = element("div");
    			img2 = element("img");
    			t4 = space();
    			p0 = element("p");
    			p0.textContent = "Home";
    			t6 = space();
    			div2 = element("div");
    			img3 = element("img");
    			t7 = space();
    			p1 = element("p");
    			p1.textContent = "Shared Data";
    			t9 = space();
    			div4 = element("div");
    			img4 = element("img");
    			t10 = space();
    			h4 = element("h4");
    			h4.textContent = "Account name";
    			attr_dev(img0, "id", "logo");
    			if (!src_url_equal(img0.src, img0_src_value = "./Logo.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "Logo");
    			attr_dev(img0, "class", "svelte-1q67ki6");
    			add_location(img0, file$9, 7, 8, 89);
    			add_location(h5, file$9, 9, 12, 177);
    			if (!src_url_equal(img1.src, img1_src_value = "./icons/add.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "Add icon");
    			attr_dev(img1, "class", "svelte-1q67ki6");
    			add_location(img1, file$9, 10, 12, 213);
    			attr_dev(div0, "id", "createTask");
    			attr_dev(div0, "class", "svelte-1q67ki6");
    			add_location(div0, file$9, 8, 8, 143);
    			attr_dev(img2, "class", "menuIcon svelte-1q67ki6");
    			if (!src_url_equal(img2.src, img2_src_value = "./icons/home.png")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "home icon");
    			add_location(img2, file$9, 13, 12, 307);
    			add_location(p0, file$9, 14, 12, 381);
    			attr_dev(div1, "id", "home");
    			attr_dev(div1, "class", "svelte-1q67ki6");
    			add_location(div1, file$9, 12, 8, 279);
    			attr_dev(img3, "class", "menuIcon svelte-1q67ki6");
    			if (!src_url_equal(img3.src, img3_src_value = "./icons/share.png")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "share data");
    			add_location(img3, file$9, 17, 12, 452);
    			add_location(p1, file$9, 18, 12, 528);
    			attr_dev(div2, "id", "sharedData");
    			attr_dev(div2, "class", "svelte-1q67ki6");
    			add_location(div2, file$9, 16, 8, 418);
    			attr_dev(div3, "id", "leftPannel-TopSection");
    			attr_dev(div3, "class", "svelte-1q67ki6");
    			add_location(div3, file$9, 6, 4, 48);
    			if (!src_url_equal(img4.src, img4_src_value = "./icons/avatar.png")) attr_dev(img4, "src", img4_src_value);
    			attr_dev(img4, "alt", "Avatar");
    			attr_dev(img4, "class", "svelte-1q67ki6");
    			add_location(img4, file$9, 24, 8, 694);
    			add_location(h4, file$9, 25, 8, 746);
    			attr_dev(div4, "id", "leftPannel-BottomSection");
    			attr_dev(div4, "class", "svelte-1q67ki6");
    			add_location(div4, file$9, 23, 4, 641);
    			attr_dev(div5, "id", "leftPannel");
    			attr_dev(div5, "class", "svelte-1q67ki6");
    			add_location(div5, file$9, 5, 0, 22);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div3);
    			append_dev(div3, img0);
    			append_dev(div3, t0);
    			append_dev(div3, div0);
    			append_dev(div0, h5);
    			append_dev(div0, t2);
    			append_dev(div0, img1);
    			append_dev(div3, t3);
    			append_dev(div3, div1);
    			append_dev(div1, img2);
    			append_dev(div1, t4);
    			append_dev(div1, p0);
    			append_dev(div3, t6);
    			append_dev(div3, div2);
    			append_dev(div2, img3);
    			append_dev(div2, t7);
    			append_dev(div2, p1);
    			append_dev(div5, t9);
    			append_dev(div5, div4);
    			append_dev(div4, img4);
    			append_dev(div4, t10);
    			append_dev(div4, h4);

    			if (!mounted) {
    				dispose = listen_dev(div4, "click", /*click_handler*/ ctx[0], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('LeftPannel', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<LeftPannel> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	return [click_handler];
    }

    class LeftPannel extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LeftPannel",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src/components/subComponents/Searchbar.svelte generated by Svelte v3.53.1 */

    const file$8 = "src/components/subComponents/Searchbar.svelte";

    function create_fragment$9(ctx) {
    	let div1;
    	let div0;
    	let input;
    	let t0;
    	let img;
    	let img_src_value;
    	let t1;
    	let button;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			input = element("input");
    			t0 = space();
    			img = element("img");
    			t1 = space();
    			button = element("button");
    			button.textContent = "Add Document";
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Find Document");
    			attr_dev(input, "class", "svelte-1fqe4we");
    			add_location(input, file$8, 2, 8, 62);
    			if (!src_url_equal(img.src, img_src_value = "./icons/search.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "search icon");
    			add_location(img, file$8, 3, 8, 118);
    			attr_dev(div0, "id", "searchbar");
    			attr_dev(div0, "class", "svelte-1fqe4we");
    			add_location(div0, file$8, 1, 4, 33);
    			attr_dev(button, "id", "addDocumentBtn");
    			attr_dev(button, "class", "svelte-1fqe4we");
    			add_location(button, file$8, 5, 4, 182);
    			attr_dev(div1, "id", "searchbar-section");
    			attr_dev(div1, "class", "svelte-1fqe4we");
    			add_location(div1, file$8, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, input);
    			append_dev(div0, t0);
    			append_dev(div0, img);
    			append_dev(div1, t1);
    			append_dev(div1, button);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Searchbar', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Searchbar> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Searchbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Searchbar",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src/components/subComponents/FolderListContainer.svelte generated by Svelte v3.53.1 */

    const file$7 = "src/components/subComponents/FolderListContainer.svelte";

    function create_fragment$8(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "class", "folder");
    			add_location(div0, file$7, 1, 4, 35);
    			attr_dev(div1, "id", "FolderListContainer");
    			attr_dev(div1, "class", "svelte-zp136j");
    			add_location(div1, file$7, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('FolderListContainer', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<FolderListContainer> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class FolderListContainer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FolderListContainer",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/components/Data.svelte generated by Svelte v3.53.1 */
    const file$6 = "src/components/Data.svelte";

    function create_fragment$7(ctx) {
    	let div;
    	let searchbar;
    	let t;
    	let folderlistcontainer;
    	let current;
    	searchbar = new Searchbar({ $$inline: true });
    	folderlistcontainer = new FolderListContainer({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(searchbar.$$.fragment);
    			t = space();
    			create_component(folderlistcontainer.$$.fragment);
    			attr_dev(div, "id", "main");
    			attr_dev(div, "class", "svelte-iwmh3y");
    			add_location(div, file$6, 5, 0, 164);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(searchbar, div, null);
    			append_dev(div, t);
    			mount_component(folderlistcontainer, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(searchbar.$$.fragment, local);
    			transition_in(folderlistcontainer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(searchbar.$$.fragment, local);
    			transition_out(folderlistcontainer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(searchbar);
    			destroy_component(folderlistcontainer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Data', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Data> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Searchbar, FolderListContainer });
    	return [];
    }

    class Data extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Data",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/components/account/Login.svelte generated by Svelte v3.53.1 */

    const file$5 = "src/components/account/Login.svelte";

    function create_fragment$6(ctx) {
    	let div3;
    	let div0;
    	let input0;
    	let t0;
    	let div1;
    	let input1;
    	let t1;
    	let div2;
    	let h4;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			input0 = element("input");
    			t0 = space();
    			div1 = element("div");
    			input1 = element("input");
    			t1 = space();
    			div2 = element("div");
    			h4 = element("h4");
    			h4.textContent = "Submit";
    			attr_dev(input0, "class", "inputField svelte-183b05");
    			attr_dev(input0, "type", "text");
    			input0.value = "";
    			attr_dev(input0, "placeholder", "Username");
    			add_location(input0, file$5, 2, 8, 49);
    			attr_dev(div0, "id", "username");
    			attr_dev(div0, "class", "svelte-183b05");
    			add_location(div0, file$5, 1, 4, 21);
    			attr_dev(input1, "class", "inputField svelte-183b05");
    			attr_dev(input1, "type", "text");
    			input1.value = "";
    			attr_dev(input1, "placeholder", "Password");
    			add_location(input1, file$5, 5, 8, 163);
    			attr_dev(div1, "id", "password");
    			attr_dev(div1, "class", "svelte-183b05");
    			add_location(div1, file$5, 4, 4, 135);
    			add_location(h4, file$5, 8, 8, 281);
    			attr_dev(div2, "id", "submitButton");
    			attr_dev(div2, "class", "svelte-183b05");
    			add_location(div2, file$5, 7, 4, 249);
    			attr_dev(div3, "id", "login");
    			attr_dev(div3, "class", "svelte-183b05");
    			add_location(div3, file$5, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div0, input0);
    			append_dev(div3, t0);
    			append_dev(div3, div1);
    			append_dev(div1, input1);
    			append_dev(div3, t1);
    			append_dev(div3, div2);
    			append_dev(div2, h4);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Login', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Login> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Login extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/components/account/Registration.svelte generated by Svelte v3.53.1 */

    const file$4 = "src/components/account/Registration.svelte";

    function create_fragment$5(ctx) {
    	let div4;
    	let div0;
    	let input0;
    	let t0;
    	let div1;
    	let input1;
    	let t1;
    	let div2;
    	let input2;
    	let t2;
    	let div3;
    	let h4;

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");
    			input0 = element("input");
    			t0 = space();
    			div1 = element("div");
    			input1 = element("input");
    			t1 = space();
    			div2 = element("div");
    			input2 = element("input");
    			t2 = space();
    			div3 = element("div");
    			h4 = element("h4");
    			h4.textContent = "Submit";
    			attr_dev(input0, "class", "inputField svelte-wi5pv8");
    			attr_dev(input0, "type", "text");
    			input0.value = "";
    			attr_dev(input0, "placeholder", "Username");
    			add_location(input0, file$4, 2, 8, 49);
    			attr_dev(div0, "id", "username");
    			attr_dev(div0, "class", "svelte-wi5pv8");
    			add_location(div0, file$4, 1, 4, 21);
    			attr_dev(input1, "class", "inputField svelte-wi5pv8");
    			attr_dev(input1, "type", "text");
    			input1.value = "";
    			attr_dev(input1, "placeholder", "Password");
    			add_location(input1, file$4, 5, 8, 163);
    			attr_dev(div1, "id", "password");
    			attr_dev(div1, "class", "svelte-wi5pv8");
    			add_location(div1, file$4, 4, 4, 135);
    			attr_dev(input2, "class", "inputField svelte-wi5pv8");
    			attr_dev(input2, "type", "text");
    			input2.value = "";
    			attr_dev(input2, "placeholder", "Confirm Password");
    			add_location(input2, file$4, 8, 8, 281);
    			attr_dev(div2, "id", "confPassword");
    			attr_dev(div2, "class", "svelte-wi5pv8");
    			add_location(div2, file$4, 7, 4, 249);
    			add_location(h4, file$4, 11, 8, 407);
    			attr_dev(div3, "id", "submitButton");
    			attr_dev(div3, "class", "svelte-wi5pv8");
    			add_location(div3, file$4, 10, 4, 375);
    			attr_dev(div4, "id", "login");
    			attr_dev(div4, "class", "svelte-wi5pv8");
    			add_location(div4, file$4, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			append_dev(div0, input0);
    			append_dev(div4, t0);
    			append_dev(div4, div1);
    			append_dev(div1, input1);
    			append_dev(div4, t1);
    			append_dev(div4, div2);
    			append_dev(div2, input2);
    			append_dev(div4, t2);
    			append_dev(div4, div3);
    			append_dev(div3, h4);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Registration', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Registration> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Registration extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Registration",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/components/account/LoginRegisMainContainer.svelte generated by Svelte v3.53.1 */
    const file$3 = "src/components/account/LoginRegisMainContainer.svelte";

    // (32:4) {:else}
    function create_else_block(ctx) {
    	let registration_1;
    	let current;
    	registration_1 = new Registration({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(registration_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(registration_1, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(registration_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(registration_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(registration_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(32:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (30:4) {#if login}
    function create_if_block$1(ctx) {
    	let login_1;
    	let current;
    	login_1 = new Login({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(login_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(login_1, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(login_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(login_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(login_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(30:4) {#if login}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div3;
    	let div2;
    	let div0;
    	let h40;
    	let t1;
    	let div1;
    	let h41;
    	let t3;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block$1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*login*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			h40 = element("h4");
    			h40.textContent = "Login";
    			t1 = space();
    			div1 = element("div");
    			h41 = element("h4");
    			h41.textContent = "Registration";
    			t3 = space();
    			if_block.c();
    			add_location(h40, file$3, 22, 12, 641);
    			attr_dev(div0, "id", "loginButton");
    			attr_dev(div0, "class", "svelte-l6apij");
    			toggle_class(div0, "backgroundHighlight", /*login*/ ctx[0]);
    			add_location(div0, file$3, 21, 8, 529);
    			add_location(h41, file$3, 26, 12, 877);
    			attr_dev(div1, "id", "registrationButton");
    			attr_dev(div1, "class", "svelte-l6apij");
    			toggle_class(div1, "backgroundHighlight", /*registration*/ ctx[1]);
    			add_location(div1, file$3, 25, 8, 744);
    			attr_dev(div2, "id", "heading");
    			attr_dev(div2, "class", "svelte-l6apij");
    			add_location(div2, file$3, 19, 4, 437);
    			attr_dev(div3, "id", "loginRegistration");
    			attr_dev(div3, "class", "svelte-l6apij");
    			add_location(div3, file$3, 18, 0, 404);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, h40);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, h41);
    			append_dev(div3, t3);
    			if_blocks[current_block_type_index].m(div3, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div0, "click", /*click_handler*/ ctx[3], false, false, false),
    					listen_dev(div1, "click", /*click_handler_1*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*login*/ 1) {
    				toggle_class(div0, "backgroundHighlight", /*login*/ ctx[0]);
    			}

    			if (!current || dirty & /*registration*/ 2) {
    				toggle_class(div1, "backgroundHighlight", /*registration*/ ctx[1]);
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(div3, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if_blocks[current_block_type_index].d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('LoginRegisMainContainer', slots, []);
    	let login = true;
    	let registration = false;

    	function changeContainer(container) {
    		if (container === "registration") {
    			$$invalidate(1, registration = true);
    			$$invalidate(0, login = false);
    		} else {
    			$$invalidate(1, registration = false);
    			$$invalidate(0, login = true);
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<LoginRegisMainContainer> was created with unknown prop '${key}'`);
    	});

    	const click_handler = e => changeContainer('login');
    	const click_handler_1 = e => changeContainer('registration');

    	$$self.$capture_state = () => ({
    		Login,
    		Registration,
    		login,
    		registration,
    		changeContainer
    	});

    	$$self.$inject_state = $$props => {
    		if ('login' in $$props) $$invalidate(0, login = $$props.login);
    		if ('registration' in $$props) $$invalidate(1, registration = $$props.registration);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [login, registration, changeContainer, click_handler, click_handler_1];
    }

    class LoginRegisMainContainer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LoginRegisMainContainer",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/components/account/AccountInfo.svelte generated by Svelte v3.53.1 */

    const { console: console_1 } = globals;
    const file$2 = "src/components/account/AccountInfo.svelte";

    function create_fragment$3(ctx) {
    	let div7;
    	let div2;
    	let div1;
    	let div0;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let h2;
    	let t2;
    	let img1;
    	let img1_src_value;
    	let t3;
    	let div6;
    	let div3;
    	let h4;
    	let t5;
    	let p;
    	let t7;
    	let div4;
    	let t8;
    	let div5;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			img0 = element("img");
    			t0 = space();
    			h2 = element("h2");
    			h2.textContent = "Hackytech";
    			t2 = space();
    			img1 = element("img");
    			t3 = space();
    			div6 = element("div");
    			div3 = element("div");
    			h4 = element("h4");
    			h4.textContent = "Account Id:";
    			t5 = space();
    			p = element("p");
    			p.textContent = "1feasfae45#asfe4";
    			t7 = space();
    			div4 = element("div");
    			t8 = space();
    			div5 = element("div");
    			attr_dev(img0, "id", "avatar");
    			if (!src_url_equal(img0.src, img0_src_value = "./icons/avatar1.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "Avatar");
    			attr_dev(img0, "class", "svelte-1pyarea");
    			add_location(img0, file$2, 20, 16, 482);
    			add_location(h2, file$2, 21, 16, 555);
    			attr_dev(div0, "class", "heading-content svelte-1pyarea");
    			add_location(div0, file$2, 19, 12, 436);
    			attr_dev(img1, "id", "returnBtn");
    			if (!src_url_equal(img1.src, img1_src_value = "./icons/close.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "Close icon");
    			attr_dev(img1, "class", "svelte-1pyarea");
    			add_location(img1, file$2, 24, 12, 676);
    			attr_dev(div1, "class", "heading-content-container svelte-1pyarea");
    			add_location(div1, file$2, 18, 8, 384);
    			attr_dev(div2, "id", "heading");
    			attr_dev(div2, "class", "svelte-1pyarea");
    			add_location(div2, file$2, 16, 4, 279);
    			attr_dev(h4, "class", "svelte-1pyarea");
    			add_location(h4, file$2, 30, 12, 865);
    			add_location(p, file$2, 30, 33, 886);
    			attr_dev(div3, "class", "field svelte-1pyarea");
    			add_location(div3, file$2, 29, 8, 833);
    			attr_dev(div4, "class", "field svelte-1pyarea");
    			add_location(div4, file$2, 32, 8, 935);
    			attr_dev(div5, "class", "field svelte-1pyarea");
    			add_location(div5, file$2, 33, 8, 969);
    			attr_dev(div6, "id", "inputFields");
    			attr_dev(div6, "class", "svelte-1pyarea");
    			add_location(div6, file$2, 28, 4, 802);
    			attr_dev(div7, "id", "accountInfo");
    			attr_dev(div7, "class", "svelte-1pyarea");
    			add_location(div7, file$2, 15, 0, 252);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, img0);
    			append_dev(div0, t0);
    			append_dev(div0, h2);
    			append_dev(div1, t2);
    			append_dev(div1, img1);
    			append_dev(div7, t3);
    			append_dev(div7, div6);
    			append_dev(div6, div3);
    			append_dev(div3, h4);
    			append_dev(div3, t5);
    			append_dev(div3, p);
    			append_dev(div6, t7);
    			append_dev(div6, div4);
    			append_dev(div6, t8);
    			append_dev(div6, div5);

    			if (!mounted) {
    				dispose = listen_dev(img1, "click", /*returnFromAccComp*/ ctx[0], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AccountInfo', slots, []);
    	const dispatch = createEventDispatcher();

    	function returnFromAccComp() {
    		console.log('Dispatching...');
    		dispatch('return', { text: 'data' });
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<AccountInfo> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		returnFromAccComp
    	});

    	return [returnFromAccComp];
    }

    class AccountInfo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AccountInfo",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/components/Account.svelte generated by Svelte v3.53.1 */
    const file$1 = "src/components/Account.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let accountinfo;
    	let current;
    	accountinfo = new AccountInfo({ $$inline: true });
    	accountinfo.$on("return", /*return_handler*/ ctx[0]);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(accountinfo.$$.fragment);
    			attr_dev(div, "id", "account");
    			attr_dev(div, "class", "svelte-1t03ve2");
    			add_location(div, file$1, 5, 0, 151);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(accountinfo, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(accountinfo.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(accountinfo.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(accountinfo);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Account', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Account> was created with unknown prop '${key}'`);
    	});

    	function return_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$capture_state = () => ({ LoginRegis: LoginRegisMainContainer, AccountInfo });
    	return [return_handler];
    }

    class Account extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Account",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/components/RightPannel.svelte generated by Svelte v3.53.1 */
    const file = "src/components/RightPannel.svelte";

    // (13:42) 
    function create_if_block_1(ctx) {
    	let account;
    	let current;
    	account = new Account({ $$inline: true });
    	account.$on("return", /*return_handler*/ ctx[1]);

    	const block = {
    		c: function create() {
    			create_component(account.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(account, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(account.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(account.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(account, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(13:42) ",
    		ctx
    	});

    	return block;
    }

    // (11:8) {#if component === "data"}
    function create_if_block(ctx) {
    	let data;
    	let current;
    	data = new Data({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(data.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(data, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(data.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(data.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(data, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(11:8) {#if component === \\\"data\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div2;
    	let div0;
    	let t;
    	let div1;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block, create_if_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*component*/ ctx[0] === "data") return 0;
    		if (/*component*/ ctx[0] === "account") return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			t = space();
    			div1 = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div0, "id", "rightPannel-topSection");
    			attr_dev(div0, "class", "svelte-1sw9cfy");
    			add_location(div0, file, 8, 4, 156);
    			attr_dev(div1, "id", "rightPannel-bottomSection");
    			attr_dev(div1, "class", "svelte-1sw9cfy");
    			add_location(div1, file, 9, 4, 200);
    			attr_dev(div2, "id", "rightPannel");
    			attr_dev(div2, "class", "svelte-1sw9cfy");
    			add_location(div2, file, 7, 0, 129);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t);
    			append_dev(div2, div1);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(div1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(div1, null);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('RightPannel', slots, []);
    	let { component } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (component === undefined && !('component' in $$props || $$self.$$.bound[$$self.$$.props['component']])) {
    			console.warn("<RightPannel> was created without expected prop 'component'");
    		}
    	});

    	const writable_props = ['component'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<RightPannel> was created with unknown prop '${key}'`);
    	});

    	function return_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ('component' in $$props) $$invalidate(0, component = $$props.component);
    	};

    	$$self.$capture_state = () => ({ Data, Account, component });

    	$$self.$inject_state = $$props => {
    		if ('component' in $$props) $$invalidate(0, component = $$props.component);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [component, return_handler];
    }

    class RightPannel extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { component: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RightPannel",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get component() {
    		throw new Error("<RightPannel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set component(value) {
    		throw new Error("<RightPannel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.53.1 */

    function create_fragment(ctx) {
    	let leftpannel;
    	let t;
    	let rightpannel;
    	let current;
    	leftpannel = new LeftPannel({ $$inline: true });
    	leftpannel.$on("click", /*click_handler*/ ctx[2]);

    	rightpannel = new RightPannel({
    			props: { component: /*component*/ ctx[0] },
    			$$inline: true
    		});

    	rightpannel.$on("return", /*showAccountPage*/ ctx[1]);

    	const block = {
    		c: function create() {
    			create_component(leftpannel.$$.fragment);
    			t = space();
    			create_component(rightpannel.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(leftpannel, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(rightpannel, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const rightpannel_changes = {};
    			if (dirty & /*component*/ 1) rightpannel_changes.component = /*component*/ ctx[0];
    			rightpannel.$set(rightpannel_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(leftpannel.$$.fragment, local);
    			transition_in(rightpannel.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(leftpannel.$$.fragment, local);
    			transition_out(rightpannel.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(leftpannel, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(rightpannel, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let component = 'data';

    	function showAccountPage(e, type = "") {
    		if (e.detail.text) {
    			$$invalidate(0, component = e.detail.text);
    		} else {
    			$$invalidate(0, component = type);
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = e => showAccountPage(e, 'account');

    	$$self.$capture_state = () => ({
    		LeftPannel,
    		RightPannel,
    		component,
    		showAccountPage
    	});

    	$$self.$inject_state = $$props => {
    		if ('component' in $$props) $$invalidate(0, component = $$props.component);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [component, showAccountPage, click_handler];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
