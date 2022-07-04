import { Form, Typography } from '@vikadata/components';
import { Strings } from './i18n';
import {
  Field, StatType, useCloudStorage, useFields,
  useRecords, useViewsMeta, useSettingsButton,
  t,
  ViewPicker,
  useMeta,
  RuntimeEnv
} from '@vikadata/widget-sdk';
import { useUpdateEffect } from 'ahooks';
import { isNumber } from 'lodash';
import React, { RefObject, useCallback, useRef } from 'react';
import { FieldSelect } from './form_components/field_select';
import { getFieldFormEnum, jsonpointer, useResize } from './helper';
import { CurrentValueWrapper, FormWrapper, SummaryWrapper } from './sc';

function isNumeric(value) {
  if (isNumber(value)) {
    return true;
  }
  if (typeof value != 'string') {
    return false;
  }
  return !isNaN(value as any) &&
    !isNaN(parseFloat(value));
}

const METRICS_TYPES = ['COUNT_RECORDS', 'AGGREGATION_BY_FIELD'];
const METRICS_TYPES_NAMES = [t(Strings.count_records), t(Strings.select_y_axis_field)];

const metricsFieldIdPointer = jsonpointer.compile('/chartStructure/metrics/fieldId');
const metricsStatTypePointer = jsonpointer.compile('/chartStructure/metrics/statType');
const metricsTypePointer = jsonpointer.compile('/chartStructure/metricsType');

const Summary = ({ openSetting, formData }) => {
  const viewId = (formData as any)?.dataSource?.view;
  const color = formData.chartStyle.color || '#7B67EE'; // FIXME: ui 分支合并后从主题中获取
  const records = useRecords(viewId);
  const fields = useFields((formData as any)?.dataSource?.view);
  const innerRef = useRef<HTMLDivElement>(null);
  const resizeHandler = ({ width, height }) => {
    const innerDom = innerRef.current;
    if (!innerDom) {
      return;
    }
    const shadowDom = document.createElement('div');
    shadowDom.setAttribute('style', 'width:max-content');

    Array.from(innerDom.childNodes).map(node => {
      const cloneNode = node.cloneNode() as HTMLDivElement;
      cloneNode.style.transform = 'scale(1)';
      shadowDom.appendChild(node.cloneNode(true));
    });

    document.body.appendChild(shadowDom);
    const innerRect = shadowDom.getBoundingClientRect();

    let ratio = 1;
    if (innerRect.width > width) {
      ratio = width / innerRect.width;
    }

    if (innerRect.height > height) {
      const heightRatio = height / innerRect.height;
      ratio = heightRatio > ratio ? ratio : heightRatio;
    }

    innerDom.setAttribute('style', `transform:scale(${ratio})`);
    document.body.removeChild(shadowDom);
    innerDom.style.visibility = 'visible';
  };

  const getSummary = (): { value: number, text: string } => {
    const { metricsType } = formData.chartStructure;
    if (metricsType === METRICS_TYPES[0]) {
      return {
        value: records.length,
        text: records.length.toString(),
      };
    }
    const metricsField = fields.find(field => field.id === formData.chartStructure.metrics.fieldId);
    const { statType } = (formData as any)?.chartStructure?.metrics || {};
    const res = metricsField?.getFieldResultByStatType(statType, records);
    if (res == null) {
      return {
        value: 0,
        text: '',
      };
    }
    if (metricsField?.formatType?.type === 'currency' && res != null) {
      if (typeof res === 'number') {
        return {
          value: res,
          text: res + '',
        };
      }
      return {
        value: Number(res?.replace(/[^0-9.-]+/g, '')),
        text: res,
      };
    }
    return {
      value: res as number,
      text: res + '',
    };
  };
  const currentValue = getSummary();
  const { targetValue, note } = formData?.chartStyle || {};
  // 统计值和目标值可计算时，展示比例。

  let targetText: string = `${targetValue} `;
  const resizeObserverRef = useResize(resizeHandler, [note, targetValue, targetText, currentValue.text]);
  const showPercent = isNumeric(targetValue) && isNumeric(currentValue.value);
  if (showPercent) {
    const percent = ((parseFloat(currentValue.value + '') / parseFloat(targetValue)) * 100).toFixed(2);
    targetText += `( ${percent} %)`;
  }
  return <SummaryWrapper style={{ width: '100%', padding: 8 }} ref={resizeObserverRef as RefObject<HTMLDivElement>}>
    <div ref={innerRef} style={{ visibility: 'hidden' }}>
      <Typography variant="h1">
        {note}
      </Typography>
      <CurrentValueWrapper color={color}>
        {currentValue.text}
      </CurrentValueWrapper>
      <Typography variant="body1">
        {targetValue && targetText}
      </Typography>
    </div>
  </SummaryWrapper>;
};

const useGetDefaultFormData = () => {
  const views = useViewsMeta();
  const fields = useFields(views[0].id);

  // 默认表单配置
  return useCallback(() => {
  // 默认表单配置
    return {
      dataSource: {
        view: views[0].id,
      },
      chartStructure: {
        metricsType: METRICS_TYPES[0],
        metrics: {
          fieldId: fields[0]?.id,
          statType: fields[0]?.statTypeList[1], // 每个字段的第一个是展示，第二个是总数。  
        },
      },
      chartStyle: {
        note: t(Strings.stat_count_all),
        color: '#7B67EE', // FIXME: 从主题取色
      },
    };
  // 因为只在第一次使用，所以不需要更新
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

const WidgetSummaryBase: React.FC = () => {
  // 新建图表需要的上下文
  const views = useViewsMeta();
  const viewEnum = views.map(view => view.id);
  const viewEnumNames = views.map(view => view.name);
  
  const defaultFormData = useGetDefaultFormData();
  const [formData, setFormData, editable] = useCloudStorage('FormData', defaultFormData);

  const fields = useFields((formData as any)?.dataSource?.view);
  const [isShowingSettings] = useSettingsButton();
  const { runtimeEnv } = useMeta();

  // 统计指标 （只有数字字段可以作为统计指标）
  const metrics = fields;
  // 汇总小程序复用统计栏逻辑
  const getStatEnums = (field?: Field) => {
    if (!field) {
      return {};
    }
    const statTypeList = field.statTypeList.filter(statType => statType !== StatType.CountAll);
    return {
      enum: statTypeList,
      enumNames: statTypeList.map(type => field.statType2text(type)),
      default: statTypeList[1],
    };
  };

  const readOnly = !editable;

  const metricsField = metrics.find(field => field.id === formData.chartStructure.metrics.fieldId);
  // 结合上下文配置表单 JSON
  const schema: any = {
    type: 'object',
    title: t(Strings.summary_widget_setting),
    properties: {
      dataSource: {
        title: t(Strings.select_data_source),
        type: 'object',
        properties: {
          view: {
            type: 'string',
            title: t(Strings.summary_widget_select_view),
            enum: viewEnum,
            enumNames: viewEnumNames,
          },
        },
      },
      chartStructure: {
        title: t(Strings.design_chart_structure),
        type: 'object',
        properties: {
          metricsType: {
            type: 'string',
            title: t(Strings.summary_widget_select_field),
            enum: METRICS_TYPES,
            enumNames: METRICS_TYPES_NAMES,
            default: METRICS_TYPES[0],
          },
        },
        dependencies: {
          metricsType: {
            oneOf: [
              {
                properties: {
                  metricsType: {
                    enum: [METRICS_TYPES[0]],
                  },
                },
              },
              {
                properties: {
                  metricsType: {
                    enum: [METRICS_TYPES[1]],
                  },
                  metrics: {
                    title: t(Strings.summary_widget_select_field),
                    type: 'object',
                    properties: {
                      fieldId: {
                        type: 'string',
                        title: '统计字段',
                        ...getFieldFormEnum(metrics),
                      },
                      statType: {
                        type: 'number',
                        title: '聚合类型',
                        ...getStatEnums(metricsField),
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      },
      chartStyle: {
        title: t(Strings.design_chart_style),
        type: 'object',
        properties: {
          note: {
            title: t(Strings.summary_widget_add_describle),
            type: 'string',
          },
          targetValue: {
            title: t(Strings.summary_widget_add_target),
            type: 'string',
          },
          color: {
            title: t(Strings.theme_color), // '配色',
            type: 'string',
          },
        },
      },
    },
  };

  // 统计字段的类型变化时。
  useUpdateEffect(() => {
    const statTypeList = metricsField?.statTypeList.filter(statType => statType !== StatType.CountAll);
    if (statTypeList && !statTypeList.includes(metricsStatTypePointer.get(formData))) {
      const _formData = JSON.parse(JSON.stringify(formData));
      metricsStatTypePointer.set(_formData, statTypeList[1]);
      setFormData(_formData);
    }
  }, [metricsField?.type]);

  const onFormChange = (data: any) => {
    const nextFormData = data.formData;
    // console.log({ nextFormData });
    // 切换字段时，上一个字段的统计类型，可能不存在于下一个字段的统计类型中，需要调整默认值。
    try {
      if (
        metricsTypePointer.get(nextFormData) === METRICS_TYPES[1] ||
        metricsFieldIdPointer.get(formData) !== metricsFieldIdPointer.get(nextFormData)
      ) {
        const metricsField = metrics.find(field => field.id === metricsFieldIdPointer.get(nextFormData));
        const statTypeList = metricsField?.statTypeList.filter(statType => statType !== StatType.CountAll);
        if (statTypeList && !statTypeList.includes(metricsStatTypePointer.get(formData))) {
          metricsStatTypePointer.set(nextFormData, statTypeList[1]);
        }
      }
    } catch (error) {
      console.error(error);
    }

    setFormData(nextFormData);
  };

  const uiSchema = {
    'ui:options': {
      help: {
        text: t(Strings.summary_widget_setting_help_tips),
        url: t(Strings.summary_widget_setting_help_url),
      },
    },
    chartStyle: {
      'ui:options': {
        showTitle: false,
      },
      color: {
        'ui:widget': 'color',
      },
    },
    dataSource: {
      'ui:options': {
        showTitle: false,
      },
      view: {
        'ui:widget': (props) => {
          return <ViewPicker placeholder={t(Strings.pick_one_option)} controlJump viewId={props.value} onChange={option => props.onChange(option.value)} />;
        },
      }
    },
    chartStructure: {
      'ui:options': {
        showTitle: false,
      },
      metricsType: {
        'ui:widget': 'toggleButtonWidget',
      },
      metrics: {
        'ui:options': {
          inline: true,
          showTitle: false,
        },
        fieldId: {
          'ui:options': {
            showTitle: false,
          },
          'ui:widget': props => <FieldSelect {...props} />,
        },
        statType: {
          'ui:options': {
            showTitle: false,
          },
          'ui:widget': 'SelectWidget',
        },
      },
    },
  };
  const transformErrors = (errors) => {
    // _setHasError(Boolean(errors && errors.length));
    return errors.map(error => {
      if (error.property === '.dataSource.view') {
        error.message = t(Strings.chart_option_view_had_been_deleted);
      }
      return error;
    });
  };
  // console.log({ schema });
  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <Summary openSetting={isShowingSettings} formData={formData} />
      {
        runtimeEnv == RuntimeEnv.Desktop && isShowingSettings && <FormWrapper openSetting={isShowingSettings} readOnly={readOnly}>
          <Form
            formData={formData}
            uiSchema={uiSchema}
            schema={schema}
            transformErrors={transformErrors}
            onChange={onFormChange}
            liveValidate
          >
            <div />
          </Form>
        </FormWrapper>
      }
    </div>
  );
};

export const WidgetSummary = React.memo(WidgetSummaryBase);
