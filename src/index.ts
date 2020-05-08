// ref:
// - https://umijs.org/plugin/develop.html
import { IApi } from '@umijs/types';
import { join } from 'path';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { AjaxResponse } from '../ui/interfaces/common';
import prettier from 'prettier';
import { writeNewRoute } from './utils/writeNewRoute';
import { generateShortFormCode } from './generate';

export default function(api: IApi) {
  // @ts-ignore
  api.addUIPlugin(() => join(__dirname, '../dist/index.umd.js'));

  // @ts-ignore
  api.onUISocket(({ action, failure, success }) => {
    const { type, payload } = action;
    let code = '';
    switch (type) {
      case 'org.umi-plugin-page-creator.shortForm':
      default:
        code = generateShortFormCode(payload);
        break;
    }
    const formattedCode = prettier.format(code, {
      singleQuote: true,
      trailingComma: 'es5',
      printWidth: 100,
      parser: 'typescript',
    });
    generateFile(formattedCode, payload, failure, success);
  });

  /**
   * 生成文件，然后更新路由，并重启服务
   * @param code
   * @param payload
   * @param failure
   * @param success
   */
  function generateFile(
    code: string,
    payload: { path: string },
    failure: (data: AjaxResponse<null>) => void,
    success: (data: AjaxResponse<null>) => void,
  ) {
    if (payload && payload.path) {
      const { path } = payload;

      const absPagesPath = api.paths.absPagesPath;
      if (!existsSync(absPagesPath + path)) {
        // 根据传入的路径，创建对应的文件夹以及index.tsx文件
        mkdirSync(absPagesPath + path);
        writeFileSync(absPagesPath + `${path}/index.tsx`, code, 'utf-8');

        // 更新路由
        writeNewRoute(
          {
            path,
            component: `.${path}`,
          },
          api.paths.cwd + '/config/config.ts',
          api.paths.absSrcPath,
        );

        success({ success: true, message: '恭喜你，文件创建成功' });
      } else {
        failure({ success: false, message: '对不起，目录已存在' });
      }
    }
  }
}
