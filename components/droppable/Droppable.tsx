import { useDroppable } from "@dnd-kit/core";

interface UseDroppableArguments {
	id: string | number;
	disabled?: boolean;
	data?: Record<string, unknown>;
	children: React.ReactNode;
}

const Droppable: React.FC<UseDroppableArguments> = (props) => {
	const { setNodeRef } = useDroppable({
		id: props.id,
	});

	const { children } = props;

	return (
		<div ref={setNodeRef} className="w-80 h-80 flex flex-col justify-start item-center">
			{children}
		</div>
	);
};

export { Droppable };
