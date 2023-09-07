import { MouseEvent, PropsWithChildren, useCallback, useMemo } from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import {
    ViewStream,
    Subject,
    Edit,
    Preview,
    Undo,
    Redo,
    Save,
    AssignmentTurnedIn,
    AssignmentLate,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { Toggles } from 'renderer/models/toggles.model';

type ButtonProps = PropsWithChildren<
    Toggles & {
        setToggles(toggles: Toggles): void;
        undo?(): void;
        redo?(): void;
        onSave?(event: MouseEvent): void;
        canUndo?: boolean;
        canRedo?: boolean;
        onShowUnaligned?(event: MouseEvent): void;
        allAligned?: boolean;
        canSave?: boolean;
        showToggles?: boolean;
    }
>;

export default function Buttons(props: ButtonProps) {
    const {
        canUndo,
        canRedo,
        setToggles,
        undo,
        redo,
        onShowUnaligned,
        allAligned,
        onSave,
        canSave,
        showToggles,
    } = props;

    const theme = useTheme();

    const togglesAll = useMemo(() => {
        const allToggles: (keyof Toggles)[] = [
            'sectionable',
            'blockable',
            'editable',
            'preview',
        ];
        return allToggles;
    }, []);
    const toggles = togglesAll.filter((toggle) => (props as Toggles)[toggle]);
    const handleToggles = useCallback(
        (_event: MouseEvent, newToggles: (keyof Toggles)[]) => {
            const updatedToggles: Toggles = {};

            togglesAll.forEach((toggle) => {
                updatedToggles[toggle] = newToggles.includes(toggle);
            });

            setToggles(updatedToggles);
        },
        [setToggles, togglesAll],
    );

    const handleUndo = (event: MouseEvent) => {
        if (undo) undo();
        event.preventDefault();
        return false;
    };

    const handleRedo = (event: MouseEvent) => {
        if (redo) redo();
        event.preventDefault();
        return false;
    };

    const handleAssignmentDataClick = (event: MouseEvent) => {
        if (onShowUnaligned) onShowUnaligned(event);
        event.preventDefault();
        return false;
    };

    return (
        <ToggleButtonGroup
            data-test-id="ToggleButtonGroup"
            value={toggles}
            onChange={handleToggles}
            aria-label="text formatting"
            className="buttons"
            sx={{
                mb: 2,
                position: 'sticky',
                top: 0,
                zIndex: 'appBar',
                background: theme.palette.background.default,
            }}
        >
            {showToggles && (
                <ToggleButton
                    data-test-id="ToggleButtonSectionable"
                    value="sectionable"
                    aria-label="sectionable"
                    title="Sectionable"
                >
                    <ViewStream />
                </ToggleButton>
            )}
            {showToggles && (
                <ToggleButton
                    data-test-id="ToggleButtonBlockable"
                    value="blockable"
                    aria-label="blockable"
                    title="Blockable"
                >
                    <Subject />
                </ToggleButton>
            )}
            {showToggles && (
                <ToggleButton
                    data-test-id="ToggleButtonPreview"
                    value="preview"
                    aria-label="preview"
                    title="Preview"
                >
                    <Preview />
                </ToggleButton>
            )}
            <ToggleButton
                data-test-id="ToggleButtonEditable"
                value="editable"
                aria-label="editable"
                title="Editable"
            >
                <Edit />
            </ToggleButton>
            <ToggleButton
                data-test-id="ButtonAssignmentData"
                value="alignment"
                aria-label="alignment"
                onClick={handleAssignmentDataClick}
                disabled={allAligned}
                title="Alignment"
            >
                {allAligned ? <AssignmentTurnedIn /> : <AssignmentLate />}
            </ToggleButton>
            <ToggleButton
                data-test-id="Undo"
                value="undo"
                aria-label="undo"
                onClick={handleUndo}
                disabled={!canUndo}
                title="Undo"
            >
                <Undo />
            </ToggleButton>
            <ToggleButton
                data-test-id="Redo"
                value="redo"
                aria-label="redo"
                onClick={handleRedo}
                disabled={!canRedo}
                title="Redo"
            >
                <Redo />
            </ToggleButton>
            <ToggleButton
                data-test-id="Save"
                value="save"
                aria-label="save"
                onClick={onSave}
                disabled={!canSave}
                title="Save"
            >
                <Save />
            </ToggleButton>
        </ToggleButtonGroup>
    );
}
