import React, { useContext, useState, useEffect } from 'react';
import { Form, Button, Card, message, Input, Row, Col } from 'antd';
import Title from '../../../../../components/Title';
import { AjaxResponse } from '../../../../../../interfaces/common';
import FormItemConfigDrawer from '../../../../../components/FormItemConfigDrawer';
import Context from '../../../Context';
import DropDownAction from '../../DropdownAction';
import { Store } from 'antd/lib/form/interface';
import ShortFormConfigDrawer from '../../drawers/ShortFormConfigDrawer';
import useFormItem from '../../../../../hooks/useFormItem';
import produce from 'immer';
import faker from 'faker';
import styles from './index.module.less';
import useConfigVisible from '../../../../../hooks/useConfigVisible';
import ConfigActions from '../../../../../components/ConfigActions';
import { transformFormItemLines } from '../../../../../utils';
import ApiConfigDrawer from '../../drawers/ApiConfigDrawer';
import useConfig from '../../../../../hooks/useConfig';
import copy from 'copy-to-clipboard';
import ExportActions from '../../ExportActions';

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 7 },
    md: { span: 10 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 12 },
    md: { span: 14 },
  },
};

export default () => {
  const { api, impConfigJson } = useContext(Context);
  const [formConfig, setFormConfig] = useState<Store>({
    title: '两列详情',
  });

  const {
    initialFetch,
    setInitialFetch,
    submitFetch,
    setSubmitFetch,
  } = useConfig();

  const {
    pathModalVisible,
    setPathModalVisible,
    formConfigDrawerVisible,
    setFormConfigDrawerVisible,
    formItemConfigDrawerVisible,
    setFormItemConfigDrawerVisible,
    apiConfigDrawerVisible,
    setApiConfigDrawerVisible,
  } = useConfigVisible();

  const {
    formItems,
    setFormItems,
    moveUp,
    moveDown,
    configItem,
    deleteItem,
    copyItem,
    currentItem,
    index,
    onConfirm,
  } = useFormItem();

  /**
   * 添加详情展示项
   */
  const addDetailItem = () => {
    setFormItems(
      produce(formItems, draft => {
        draft.push({
          label: faker.name.title(),
          name: faker.name.lastName(),
          type: 'input',
        });
      }),
    );
  };

  const handleApiSubmit = (initialFetch?: string[], submitFetch?: string[]) => {
    setInitialFetch(initialFetch);
    setSubmitFetch(submitFetch);
  };

  /**
   * 把配置的表单信息和添加的表单项配置传到服务端
   */
  const remoteCall = async ({ path, dirName }: { path: string; dirName?: string }) => {
    // 对formItems进行遍历，如果其中有任一项没有配置label/name，则不允许提交
    if (formItems.length === 0) {
      message.error('您还没有添加详情展示项，不能提交！');
      return;
    }
    try {
      const result = await api.callRemote({
        type: 'org.umi-plugin-page-creator.longDetailModal',
        payload: {
          formConfig,
          formItems,
          path,
          dirName,
          initialFetch,
          submitFetch,
        },
      });
      message.success((result as AjaxResponse<string>).message);
      setPathModalVisible(false);
    } catch (error) {
      message.error(error.message);
    }
  };

  /** 把导入的配置信息进行解析 */
  useEffect(() => {
    if (impConfigJson) {
      const { formConfig = { title: '两列详情', }, formItems = [], initialFetch = [], submitFetch = [] } = JSON.parse(impConfigJson);
      setFormConfig(formConfig);
      setFormItems(formItems);
      setInitialFetch(initialFetch);
      setSubmitFetch(submitFetch);
    }
  }, [impConfigJson]);

  /** 导出 */
  const handleExport = () => {
    copy(JSON.stringify({
      formConfig,
      formItems,
      initialFetch,
      submitFetch
    }, null, 2));
    message.success('配置已复制到剪贴板');
  };

  const cols = 2;
  // 把formItems分成2列
  const formItemLines = transformFormItemLines(formItems, cols);

  return (
    <>
      <Card
        title={<Title text={formConfig.title} />}
        extra={
          <Button type="primary" onClick={() => setFormConfigDrawerVisible(true)}>
            配置
          </Button>
        }
      >
        <Form {...formItemLayout}>
          {formItemLines.map((line, index) => (
            <Row>
              {line.map((formItem, itemIndex) => (
                <Col span={12}>
                  <div className={styles.formItemConfig}>
                    <ConfigActions
                      position="top"
                      moveUp={moveUp(index * cols + itemIndex)}
                      moveDown={moveDown(index * cols + itemIndex)}
                      configItem={() => {
                        configItem(formItem, index * cols + itemIndex);
                        setFormItemConfigDrawerVisible(true);
                      }}
                      deleteItem={deleteItem(index * cols + itemIndex)}
                      copyItem={copyItem(index * cols + itemIndex)}
                    />
                    <Form.Item label={formItem.label} name={formItem.name}>
                      <Input disabled />
                    </Form.Item>
                  </div>
                </Col>
              ))}
            </Row>
          ))}
          <Button onClick={addDetailItem} type="dashed" style={{ width: '100%', marginBottom: 32 }}>
            添加展示项
          </Button>
          <Button type="primary" onClick={() => setApiConfigDrawerVisible(true)}>
            页面接口配置
          </Button>
        </Form>
      </Card>

      {/**页面接口配置 */}
      <ApiConfigDrawer
        visible={apiConfigDrawerVisible}
        setVisible={setApiConfigDrawerVisible}
        onSubmit={handleApiSubmit}
        initialFetch={initialFetch}
        submitFetch={submitFetch}
      />

      {/**表单配置 */}
      <ShortFormConfigDrawer
        visible={formConfigDrawerVisible}
        setVisible={setFormConfigDrawerVisible}
        onFinish={setFormConfig}
        formConfig={formConfig}
      />

      {/**配置单个表单项 */}
      {currentItem && (
        <FormItemConfigDrawer
          visible={formItemConfigDrawerVisible}
          onVisible={setFormItemConfigDrawerVisible}
          index={index}
          formItem={currentItem}
          onConfirm={onConfirm}
          from="detail"
          initialFetch={initialFetch}
        />
      )}

      {/**提交时候弹出的输入文件路径 */}
      <DropDownAction
        onRemoteCall={remoteCall}
        modalVisible={pathModalVisible}
        setModalVisible={setPathModalVisible}
        modal
      />

      <ExportActions onClick={handleExport} />
    </>
  );
};
