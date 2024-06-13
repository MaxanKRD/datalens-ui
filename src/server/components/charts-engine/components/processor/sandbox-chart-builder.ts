import ivm from 'isolated-vm';

import {DashWidgetConfig, EDITOR_TYPE_CONFIG_TABS} from '../../../../../shared';
import {ChartsEngine} from '../../index';
import {ResolvedConfig} from '../storage/types';

import {ModulesSandbox} from './modulesSandbox';
import {Sandbox, SandboxExecuteResult} from './sandbox';
import {ChartBuilder, ChartBuilderResult} from './types';

import {Processor} from './index';

const ONE_SECOND = 1000;
const JS_EXECUTION_TIMEOUT = ONE_SECOND * 9.5;

type SandboxChartBuilderArgs = {
    userLogin: string | null;
    userLang: string | null;
    isScreenshoter: boolean;
    chartsEngine: ChartsEngine;
    widgetConfig?: DashWidgetConfig['widgetConfig'];
    config: {data: Record<string, string>; meta: {stype: string}; key: string};
    workbookId?: string;
};

// const extractModules = (modules: Record<string, SandboxExecuteResult>) => {
//     const extracted = Object.keys(modules).reduce<Record<string, object>>((acc, moduleName) => {
//         acc[moduleName] = modules[moduleName].exports as object;
//         return acc;
//     }, {});

//     return extracted;
// };

export const getSandboxChartBuilder = async (
    args: SandboxChartBuilderArgs,
): Promise<ChartBuilder> => {
    const {userLogin, userLang, isScreenshoter, chartsEngine, config, widgetConfig, workbookId} =
        args;
    const type = config.meta.stype;
    let shared: Record<string, any>;
    const isolate = new ivm.Isolate({memoryLimit: 128});
    const context = isolate.createContextSync();
    // runtime.setMemoryLimit(1024 * 1024 * 10);
    // runtime.setInterruptHandler(shouldInterruptAfterDeadline(Date.now() + timeout));

    return {
        dispose: () => {
            context.release();
        },
        buildShared: async () => {
            shared = JSON.parse(config.data.shared || '{}');
        },

        buildModules: async ({subrequestHeaders, req, ctx, onModuleBuild}) => {
            const resolvedModules = (await Processor.resolveDependencies({
                chartsEngine,
                config,
                subrequestHeaders,
                req,
                ctx,
                workbookId,
            })) as ResolvedConfig[];

            const processedModules: Record<string, SandboxExecuteResult> = {};
            for await (const resolvedModule of resolvedModules) {
                const name = resolvedModule.key;
                await ModulesSandbox.processModule({
                    name,
                    code: resolvedModule.data.js,
                    userLogin,
                    userLang,
                    nativeModules: chartsEngine.nativeModules,
                    isScreenshoter,
                    context,
                });
                onModuleBuild(processedModules[name]);
            }

            // Object.keys(processedModules).forEach((moduleName) => {
            //     const module = processedModules[moduleName];
            //     modules[moduleName] = module.exports;
            // });

            return processedModules as unknown as Record<string, ChartBuilderResult>;
        },

        buildParams: async (options) => {
            const tabResult = await Sandbox.processTab({
                name: 'Params',
                code: config.data.params,
                timeout: ONE_SECOND,
                hooks: options.hooks,
                nativeModules: chartsEngine.nativeModules,
                params: options.params,
                actionParams: options.actionParams,
                widgetConfig,
                shared,
                userLogin,
                userLang,
                isScreenshoter,
                context,
            });

            return {
                ...tabResult,
                name: tabResult.filename,
            };
        },
        buildUrls: async (options) => {
            const tabResult = await Sandbox.processTab({
                name: 'Urls',
                code: config.data.url,
                timeout: ONE_SECOND,
                hooks: options.hooks,
                nativeModules: chartsEngine.nativeModules,
                shared,
                params: options.params,
                actionParams: options.actionParams,
                widgetConfig,
                userLogin,
                userLang,
                isScreenshoter,
                context,
            });

            return {
                ...tabResult,
                name: tabResult.filename,
            };
        },
        buildChartLibraryConfig: async (options) => {
            const data = options.data as Record<string, unknown> | undefined;
            let tabResult;
            if (config.data.graph) {
                const tabName = type.startsWith('timeseries') ? 'Yagr' : 'Highcharts';
                // Highcharts tab
                tabResult = await Sandbox.processTab({
                    name: tabName,
                    code: config.data.graph,
                    timeout: ONE_SECOND,
                    hooks: options.hooks,
                    nativeModules: chartsEngine.nativeModules,
                    shared,
                    params: options.params,
                    actionParams: options.actionParams,
                    widgetConfig,
                    data,
                    userLogin,
                    userLang,
                    isScreenshoter,
                    context,
                });
            } else if (config.data.map) {
                // Highcharts tab
                tabResult = await Sandbox.processTab({
                    name: 'Highmaps',
                    code: config.data.map,
                    timeout: ONE_SECOND,
                    hooks: options.hooks,
                    nativeModules: chartsEngine.nativeModules,
                    shared,
                    params: options.params,
                    actionParams: options.actionParams,
                    widgetConfig,
                    data,
                    userLogin,
                    userLang,
                    isScreenshoter,
                    context,
                });
            } else if (config.data.ymap) {
                // Yandex.Maps tab
                tabResult = await Sandbox.processTab({
                    name: 'Yandex.Maps',
                    code: config.data.ymap,
                    timeout: ONE_SECOND,
                    hooks: options.hooks,
                    nativeModules: chartsEngine.nativeModules,
                    shared,
                    params: options.params,
                    actionParams: options.actionParams,
                    widgetConfig,
                    data,
                    userLogin,
                    userLang,
                    isScreenshoter,
                    context,
                });
            }

            if (tabResult) {
                return {
                    ...tabResult,
                    name: tabResult.filename,
                };
            }

            return null;
        },
        buildChartConfig: async (options) => {
            const data = options.data as Record<string, unknown> | undefined;
            const configTab = EDITOR_TYPE_CONFIG_TABS[type as keyof typeof EDITOR_TYPE_CONFIG_TABS];
            const tabResult = await Sandbox.processTab({
                name: 'Config',
                code: config.data[configTab as keyof typeof config.data] || '',
                timeout: ONE_SECOND,
                hooks: options.hooks,
                nativeModules: chartsEngine.nativeModules,
                shared,
                params: options.params,
                actionParams: options.actionParams,
                widgetConfig,
                data,
                userLogin,
                userLang,
                isScreenshoter,
                context,
            });

            return {
                ...tabResult,
                name: tabResult.filename,
            };
        },
        buildChart: async (options) => {
            const data = options.data as Record<string, unknown> | undefined;
            const tabResult = await Sandbox.processTab({
                name: 'JavaScript',
                code: config.data.js || 'module.exports = {};',
                timeout: JS_EXECUTION_TIMEOUT,
                nativeModules: chartsEngine.nativeModules,
                shared,
                params: options.params,
                actionParams: options.actionParams,
                widgetConfig,
                data,
                dataStats: options.sources,
                userLogin,
                userLang,
                hooks: options.hooks,
                isScreenshoter,
                context,
            });

            return {
                ...tabResult,
                name: tabResult.filename,
            };
        },
        buildUI: async (options) => {
            const data = options.data as Record<string, unknown> | undefined;
            const tabResult = await Sandbox.processTab({
                name: 'UI',
                code: config.data.ui || '',
                timeout: ONE_SECOND,
                hooks: options.hooks,
                nativeModules: chartsEngine.nativeModules,
                shared,
                params: options.params,
                actionParams: options.actionParams,
                widgetConfig,
                data,
                userLogin,
                userLang,
                isScreenshoter,
                context,
            });

            return {
                ...tabResult,
                name: tabResult.filename,
            };
        },
    };
};
