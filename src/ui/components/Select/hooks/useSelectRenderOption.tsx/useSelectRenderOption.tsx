import React, {useCallback} from 'react';

import {Button, Flex, SelectOption as Option, SelectProps} from '@gravity-ui/uikit';
import block from 'bem-cn-lite';
import {I18n} from 'i18n';

import './SelectOption.scss';

export type UseSelectRenderOptionProps<T = any> = {options: Option<T>[]} & Pick<
    SelectProps,
    'options' | 'multiple' | 'onUpdate' | 'value'
>;

const i18n = I18n.keyset('components.common.YCSelect');
const bDefault = block('select-default-option');
const bMulti = block('select-multi-option');

type OptionSelectionMode = 'only' | 'except';
type DefaultOptionProps<T = any> = {
    option: Option<T>;
};
type MultiOptionProps<T = any> = {
    onClick: (value: string, mode: OptionSelectionMode) => void;
} & DefaultOptionProps<T>;

const DefaultOption = (props: DefaultOptionProps) => {
    const {option} = props;

    return (
        <div className={bDefault()} title={String(option.content)}>
            {option.content}
        </div>
    );
};

const MultiSelectOption = (props: MultiOptionProps) => {
    const [mode, setMode] = React.useState<'only' | 'except'>('only');

    const {option, onClick} = props;

    return (
        <Flex className={bMulti()} alignItems={'center'} justifyContent={'space-between'}>
            <DefaultOption option={option} />
            <Button
                className={bMulti('action-button')}
                size="s"
                onFocus={(e: React.FocusEvent<HTMLButtonElement, HTMLElement>) =>
                    e?.relatedTarget?.focus()
                }
                onClick={(e) => {
                    e.stopPropagation();
                    onClick(option.value, mode);
                    setMode(mode === 'only' ? 'except' : 'only');
                }}
            >
                {i18n(`item_${mode}`)}
            </Button>
        </Flex>
    );
};

export const useSelectRenderOption = ({
    options,
    multiple,
    onUpdate,
}: UseSelectRenderOptionProps) => {
    const handleClick = React.useCallback(
        (val: string, mode: OptionSelectionMode) => {
            if (mode === 'only') {
                onUpdate?.([val]);
            } else {
                onUpdate?.(options?.map(({value}) => value).filter((value) => value !== val));
            }
        },
        [onUpdate, options],
    );

    const renderOption = useCallback(
        (opt) => {
            return multiple ? (
                <MultiSelectOption option={opt} onClick={handleClick} />
            ) : (
                <DefaultOption option={opt} />
            );
        },
        [handleClick, multiple],
    );

    return {renderOption};
};
