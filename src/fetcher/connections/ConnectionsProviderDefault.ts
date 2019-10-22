import { AsyncIterator } from "asynciterator";
import { inject, injectable } from "inversify";
import { EventType } from "../..";
import Catalog from "../../Catalog";
import IConnection from "../../entities/connections/connections";
import { ILinkedConnectionsPageIndex, LinkedConnectionsPage } from "../../entities/connections/page";
import EventBus from "../../events/EventBus";
import TYPES, { ConnectionsFetcherFactory } from "../../types";
import BackwardConnectionIterator from "./BackwardConnectionIterator";
import ForwardConnectionIterator from "./ForwardConnectionIterator";
import IConnectionsFetcher from "./IConnectionsFetcher";
import IConnectionsIteratorOptions from "./IConnectionsIteratorOptions";
import IConnectionsProvider from "./IConnectionsProvider";

@injectable()
export default class ConnectionsProviderDefault implements IConnectionsProvider {

    protected fetcher: IConnectionsFetcher;
    protected pages: ILinkedConnectionsPageIndex = {};
    protected accessUrl: string;

    constructor(
        @inject(TYPES.ConnectionsFetcherFactory) connectionsFetcherFactory: ConnectionsFetcherFactory,
        @inject(TYPES.Catalog) catalog: Catalog,
    ) {
        if (catalog.connectionsSourceConfigs.length > 1) {
            throw (new Error("Use the ConnectionsProviderMerge if you have multiple connections sources"));
        }

        const { accessUrl, travelMode } = catalog.connectionsSourceConfigs[0];
        this.accessUrl = accessUrl;
        this.fetcher = connectionsFetcherFactory(travelMode);
    }

    public async getByUrl(url: string): Promise<LinkedConnectionsPage> {
        if (!this.pages[url]) {
            this.pages[url] = this.fetcher.get(url);
        }

        return await this.pages[url];
    }

    public async getByTime(date: Date): Promise<LinkedConnectionsPage> {
        // TODO, look up in the index -- use lower/upper bounds of each page
        const url = this.getIdForTime(date);
        return this.getByUrl(url);
    }

    public getIdForTime(date: Date): string {
        return `${this.accessUrl}?departureTime=${date.toISOString()}`;
    }

    public prefetchConnections(lowerBound: Date, upperBound: Date): void {
        const iterator = this.createIterator({
            upperBoundDate: upperBound,
            lowerBoundDate: lowerBound,
        });

        iterator.on("readable", () => {
            while (iterator.read()) {
                //
            }
        });
    }

    public createIterator(options: IConnectionsIteratorOptions): AsyncIterator<IConnection> {
        EventBus.getInstance().emit(
            EventType.ConnectionIteratorView,
            options.lowerBoundDate,
            options.upperBoundDate,
        );

        let iterator: AsyncIterator<IConnection>;
        if (options.backward) {
            const beginTime = options.upperBoundDate;
            const beginUrl = this.getIdForTime(beginTime);
            iterator = new BackwardConnectionIterator(this, options, beginUrl);
        } else {
            const beginTime = options.lowerBoundDate;
            const beginUrl = this.getIdForTime(beginTime);
            iterator = new ForwardConnectionIterator(this, options, beginUrl);
        }

        return iterator.on("end", () => {
            EventBus.getInstance().emit(
                EventType.ConnectionIteratorView,
                options.lowerBoundDate,
                options.upperBoundDate,
                true,
            );
        });
    }
}
