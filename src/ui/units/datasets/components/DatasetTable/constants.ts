import {DatasetFieldCalcMode, Feature} from 'shared';
import {Utils} from 'ui';

import {MenuItem} from './types';

export const FORMULA_CALC_MODE: DatasetFieldCalcMode = 'formula';

export enum FieldAction {
    CopyGuid = 'copyGuid',
    Duplicate = 'duplicate',
    Edit = 'edit',
    Inspect = 'inspect',
    Remove = 'remove',
    Rls = 'rls',
    Color = 'color',
    Formatting = 'formatting',
}

const DUPLICATE: MenuItem = {action: FieldAction.Duplicate, label: 'button_duplicate'};
const EDIT: MenuItem = {action: FieldAction.Edit, label: 'button_edit'};
const RLS: MenuItem = {action: FieldAction.Rls, label: 'button_row-level-security'};
const COPY_GUID: MenuItem = {action: FieldAction.CopyGuid, label: 'button_copy-id'};

export const getCommonMenuItemsData = () => {
    if (Utils.isEnabledFeature(Feature.DatasetsRLS)) {
        return [DUPLICATE, EDIT, RLS, COPY_GUID];
    }

    return [DUPLICATE, EDIT, COPY_GUID];
};

const getSettingsMenuItemsData = () => {
    if (Utils.isEnabledFeature(Feature.DatasetFieldSettings)) {
        return [
            {action: FieldAction.Color, label: 'button_color-settings'},
            {action: FieldAction.Formatting, label: 'button_format-settings'},
        ];
    }

    return [];
};

export const GROUPED_ITEMS: MenuItem[][] = [
    getCommonMenuItemsData(),
    getSettingsMenuItemsData(),
    [{action: FieldAction.Remove, label: 'button_remove', theme: 'danger'}],
    [{action: FieldAction.Inspect, label: 'button_inspect', hidden: !Utils.isSuperUser()}],
];
