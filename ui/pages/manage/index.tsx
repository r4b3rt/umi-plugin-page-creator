/*
 * @文件描述:
 * @公司: thundersdata
 * @作者: 陈杰
 * @Date: 2020-04-29 11:06:58
 * @LastEditors: 黄姗姗
 * @LastEditTime: 2020-05-29 11:40:48
 */
import React, { useState, useEffect } from 'react'; // -> 暂时先解决报错，后期全部删掉
import { Layout, message } from 'antd';
import { IUiApi } from '@umijs/ui-types';
import Context from './Context';
import TemplateList from './components/TemplateList';
import Dashboard from './components/Dashboard';
import './index.module.less';
import { TemplateType } from '../../../interfaces/common';
import { CascaderOptionType } from 'antd/lib/cascader';
import { BaseClass } from '../../../interfaces/api';
import ImportActions from './components/ImportActions';
import ExportActions from './components/ExportActions';
import { Store } from 'antd/lib/form/interface';

const { Header, Content } = Layout;

export default ({ api }: { api: IUiApi }) => {
  const [databases, setDatabases] = useState<CascaderOptionType[]>([]);
  const [baseClasses, setBaseClasses] = useState<BaseClass[]>([]);
  const [templateType, setTemplate] = useState<TemplateType>();
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [impConfigJson, setImpConfigJson] = useState<string>(''); // 导入的json
  const [expConfigJson, setExpConfigJson] = useState<string>(''); // 导出的json

  /** 页面加载时调用后端接口，后端从services/api-lock.json读取数据，生成对应的接口以及类型 */
  useEffect(() => {
    (async () => {
      const result = (await api.callRemote({
        type: 'org.umi-plugin-page-creator.apiGenerator',
        payload: {
          fetchApiJson: true,
        },
      })) as { databases: CascaderOptionType[]; success: boolean; baseClasses: BaseClass[]; };

      if (!result.success) {
        message.warning('你的项目没有集成pont');
      } else {
        setDatabases(result.databases);
        setBaseClasses(result.baseClasses);
      }
    })();
  }, []);

  const addTemplate = (templateType: TemplateType) => {
    setTemplate(templateType);
    setImpConfigJson('');
    setExpConfigJson('');
    message.success('模板添加成功，你可以开始配置了');
  };

  /** 导入 */
  const handleImportSubmit = (values: Store) => {
    setImportModalVisible(false);
    const { importConfig } = values;
    setImpConfigJson(importConfig);
  }

  return (
    <Context.Provider
      value={{
        api,
        templateType,
        addTemplate,
        databases,
        baseClasses,
        impConfigJson,
        setImpConfigJson,
        exportModalVisible,
        expConfigJson,
        setExpConfigJson,
      }}
    >
      <Layout style={{ overflowY: 'auto' }}>
        <Header>
          <TemplateList />
        </Header>
        <Content>
          {/* 导入 */}
          <ImportActions
            modalVisible={importModalVisible}
            setModalVisible={setImportModalVisible}
            onSubmit={handleImportSubmit}
          />

          {/* 导出 */}
          <ExportActions
            modalVisible={exportModalVisible}
            setModalVisible={setExportModalVisible}
          />
          <Dashboard />
        </Content>
      </Layout>
    </Context.Provider>
  );
};
