import { initializeWidget } from '@apitable/widget-sdk';
import { WidgetSummary } from './summary';

initializeWidget(WidgetSummary, process.env.WIDGET_PACKAGE_ID);
