import { useDroppable } from "@dnd-kit/core";

interface UseDroppableArguments {
	id: string | number;
	disabled?: boolean;
	data?: Record<string, unknown>;
	children: React.ReactNode;
}

const DroppableArchive: React.FC<UseDroppableArguments> = (props) => {
	const { setNodeRef } = useDroppable({
		id: props.id,
	});

	const { children } = props;

	return <div ref={setNodeRef}>{children}</div>;
};

export { DroppableArchive };
