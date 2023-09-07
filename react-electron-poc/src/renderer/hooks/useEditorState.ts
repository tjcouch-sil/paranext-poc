import { useState, useCallback, PropsWithoutRef } from 'react';
import { Toggles } from 'renderer/models/toggles.model';

type EditorStateProps = PropsWithoutRef<
    Toggles & {
        sequenceId?: string;
        sequenceIds: string[];
    }
>;

export default function useEditorState(props: EditorStateProps) {
    const initialState: EditorStateProps = {
        sequenceId: undefined,
        sectionable: true,
        blockable: true,
        editable: true,
        preview: true,
        ...props,
    };

    const [state, setState] = useState(initialState);

    const setSectionable = useCallback((sectionable: boolean) => {
        setState((prev) => ({ ...prev, sectionable }));
    }, []);

    const setBlockable = useCallback((blockable: boolean) => {
        setState((prev) => ({ ...prev, blockable }));
    }, []);

    const setEditable = useCallback((editable: boolean) => {
        setState((prev) => ({ ...prev, editable }));
    }, []);

    const setPreview = useCallback((preview: boolean) => {
        setState((prev) => ({ ...prev, preview }));
    }, []);

    const setToggles = useCallback((toggles: Toggles) => {
        setState((prev) => ({ ...prev, ...toggles }));
    }, []);

    const setSequenceIds = useCallback((sequenceIds: string[]) => {
        setState((prev) => ({ ...prev, sequenceIds }));
    }, []);

    const setSequenceId = useCallback((sequenceId: string) => {
        setState((prev) => ({ ...prev, sequenceId }));
    }, []);

    const addSequenceId = useCallback(
        (sequenceId: string) => {
            setSequenceIds([...state.sequenceIds, sequenceId]);
        },
        [state.sequenceIds, setSequenceIds],
    );

    const actions = {
        setSectionable,
        setBlockable,
        setEditable,
        setPreview,
        setToggles,
        setSequenceIds,
        addSequenceId,
        setSequenceId,
    };

    return { state, actions };
}
