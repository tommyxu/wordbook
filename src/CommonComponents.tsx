import React from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";

interface ConfirmDialogProps {
  show: boolean;

  title: string;
  message?: string;
  description?: string;
  children?: React.ReactNode;

  yesPrompt?: string;
  noPrompt?: string;

  onHide?: () => void;
  onAction: (actionKey: string) => void;
}

export const ConfirmDialog = (props: ConfirmDialogProps) => {
  const {
    title,
    message,
    description,
    yesPrompt,
    noPrompt,
    show,
    onAction,
    onHide,
    children,
  } = props;

  const hideAction =
    onHide ||
    (() => {
      onAction("hide");
    });

  return (
    <Modal show={show} onHide={hideAction}>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {message && <p>{message}</p>}
        {description && <p>{description}</p>}
        {children}
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={() => onAction?.("no")}
          css={{
            minWidth: "6rem",
          }}
        >
          {noPrompt || "No"}
        </Button>
        <Button
          variant="primary"
          onClick={() => onAction?.("yes")}
          css={{
            minWidth: "6rem",
          }}
        >
          {yesPrompt || "Yes"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
