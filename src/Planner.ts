import { AsyncIterator } from "asynciterator";
// @ts-ignore
import { EventEmitter, Listener } from "events";
import Context from "./Context";
import EventType from "./EventType";
import IPath from "./interfaces/IPath";
import IQuery from "./interfaces/IQuery";
import defaultContainer from "./inversify.config";
import IQueryRunner from "./query-runner/IQueryRunner";
import TYPES from "./types";

if (!Symbol.asyncIterator) {
  (Symbol as any).asyncIterator = Symbol.for("Symbol.asyncIterator");
}

/**
 * Allows to ask route planning queries over our knowledge graphs
 */
// @ts-ignore
export default class Planner implements EventEmitter {
  private context: Context;
  private queryRunner: IQueryRunner;

  /**
   * Initializes a new Planner
   * @param container The container of dependencies we are working with
   */
  constructor(container = defaultContainer) {
    // Store container on context before doing anything else
    this.context = container.get<Context>(TYPES.Context);
    this.context.setContainer(container);

    this.queryRunner = container.get<IQueryRunner>(TYPES.QueryRunner);
  }

  /**
   * Given an [[IQuery]], it will evaluate the query and eventually produce an [[IQueryResult]]
   * @param query An [[IQuery]] specifying a route planning query
   * @returns An AsyncIterator of [[IPath]]s
   */
  public async query(query: IQuery): Promise<AsyncIterator<IPath>> {
    this.emit(EventType.Query, query);

    const iterator = await this.queryRunner.run(query);

    this.once(EventType.QueryAbort, () => {
      iterator.close();
    });

    return iterator;
  }

  public addListener(type: string | symbol, listener: Listener): this {
    this.context.addListener(type, listener);

    return this;
  }

  public emit(type: string | symbol, ...args: any[]): boolean {
    return this.context.emit(type, ...args);
  }

  public listenerCount(type: string | symbol): number {
    return this.context.listenerCount(type);
  }

  public listeners(type: string | symbol): Listener[] {
    return this.context.listeners(type);
  }

  public on(type: string | symbol, listener: Listener): this {
    this.context.on(type, listener);

    return this;
  }

  public once(type: string | symbol, listener: Listener): this {
    this.context.once(type, listener);

    return this;
  }

  public removeAllListeners(type?: string | symbol): this {
    this.context.removeAllListeners(type);

    return this;
  }

  public removeListener(type: string | symbol, listener: Listener): this {
    this.context.removeListener(type, listener);

    return this;
  }

  public setMaxListeners(n: number): this {
    this.context.setMaxListeners(n);

    return this;
  }
}