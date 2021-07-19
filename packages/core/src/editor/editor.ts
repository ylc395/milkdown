import { createContainer, Meta } from '../context';
import { parser, schema, serializer, editorView, init, keymap, inputRules, config } from '../internal-plugin';
import { Configure, Ctx, CtxHandler, MilkdownPlugin, Pre } from '../utility';

const internalPlugins = [schema, parser, serializer, editorView, keymap, inputRules, init];

export class Editor {
    #container = createContainer();
    #ctx: Ctx = {
        use: this.#container.getCtx,
    };
    #plugins: Set<CtxHandler> = new Set();
    #configure: Configure = () => undefined;
    inject = <T>(meta: Meta<T>) => {
        meta(this.#container.contextMap);
        return this.#pre;
    };
    #pre: Pre = {
        inject: this.inject,
    };

    #loadInternal = () => {
        this.use(internalPlugins.concat(config(this.#configure)));
    };

    use = (plugins: MilkdownPlugin | MilkdownPlugin[]) => {
        if (Array.isArray(plugins)) {
            plugins.forEach((plugin) => {
                this.#plugins.add(plugin(this.#pre));
            });
            return this;
        }

        this.#plugins.add(plugins(this.#pre));
        return this;
    };

    config = (configure: Configure) => {
        this.#configure = configure;
        return this;
    };

    create = async () => {
        this.#loadInternal();
        await Promise.all(
            [...this.#plugins].map((loader) => {
                return loader(this.#ctx);
            }),
        );
        return this;
    };

    action = <T>(fn: (ctx: Ctx) => T) => {
        return fn(this.#ctx);
    };
}
