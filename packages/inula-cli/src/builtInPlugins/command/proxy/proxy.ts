/*
 * Copyright (c) 2023 Huawei Technologies Co.,Ltd.
 *
 * openInula is licensed under Mulan PSL v2.
 * You can use this software according to the terms and conditions of the Mulan PSL v2.
 * You may obtain a copy of Mulan PSL v2 at:
 *
 *          http://license.coscl.org.cn/MulanPSL2
 *
 * THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
 * EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
 * MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
 * See the Mulan PSL v2 for more details.
 */

import express from 'express';
import { createRequire } from 'module';
import { createProxyMiddleware } from 'http-proxy-middleware';
const require = createRequire(import.meta.url);

export default (api: any) => {
  api.registerCommand({
    name: 'proxy',
    description: 'remote proxy',
    initialState: api.userConfig.remoteProxy,
    fn: async function (args: any, state: any) {
      if (!state) {
        api.logger.error('Invalid proxy config!');
        return;
      }
      const app = express();
      const proxyConfig = state;
      const staticList = proxyConfig.localStatic;
      staticList.forEach(function (value: { url: any; local: string }) {
        app.use(value.url, express.static(value.local));
      });
      const remoteProxy = createProxyMiddleware(proxyConfig.fowardingURL, {
        target: proxyConfig.target,
        secure: false,
        autoRewrite: true,
        protocolRewrite: 'http',
        ws: true,
        hostRewrite: '',
        preserveHeaderKeyCase: true,
        proxyTimeout: 5 * 60 * 60 * 1000,
        timeout: 5 * 60 * 60 * 1000,
        onError: handleProxyError,
      });
      function handleProxyError(err: any) {
        api.logger.error('Local proxy error. Error is ', err);
      }
      app.use(remoteProxy);

      app.listen(proxyConfig.localPort, () => {
        api.logger.info(`Start proxy client on http://localhost:${proxyConfig.localPort}`);
      });
    },
  });
};
