import { useDroppable } from "@dnd-kit/core";
import React, { PropsWithChildren } from "react";

interface DroppableProps {
	id: string | number;
}

const Droppable: React.FC<PropsWithChildren<DroppableProps>> = (props) => {
	const { setNodeRef } = useDroppable({
		id: props.id,
	});

	return <div ref={setNodeRef}>{props.children}</div>;
};

export { Droppable };
