import userEvent from "@testing-library/user-event";

import { act, fireEvent, render, screen, waitFor } from "__support__/ui";
import { defer } from "metabase/utils/promise";

import type { EditableTextProps } from "./EditableText";
import { EditableText } from "./EditableText";

const setup = (props?: Partial<EditableTextProps>) => {
  render(<EditableText {...props} />);
};

describe("EditableText", () => {
  describe("when there is no initial value", () => {
    it("should render input", () => {
      setup();

      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });
  });

  it("should render markdown, not input", () => {
    setup({
      initialValue: "Description",
      isMarkdown: true,
    });

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
  });

  it("should render input after a click", async () => {
    setup({
      initialValue: "Description",
      isMarkdown: true,
    });

    await userEvent.click(screen.getByText("Description"));

    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("should focus the input", async () => {
    setup({
      initialValue: "Description",
      isMarkdown: true,
    });

    await userEvent.click(screen.getByText("Description"));

    await waitFor(() => {
      expect(screen.getByRole("textbox")).toHaveFocus();
    });
  });

  it("should render markdown on blur", async () => {
    setup({
      initialValue: "**bold** [link](https://metabase.com)",
      isMarkdown: true,
    });

    await userEvent.click(screen.getByTestId("editable-text"));

    await waitFor(() => {
      expect(screen.getByRole("textbox")).toHaveFocus();
    });

    await userEvent.tab();

    expect(screen.getByTestId("editable-text")).toHaveTextContent("bold link");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("should not render input if click happened on the link", async () => {
    setup({
      initialValue: "**bold** [link](https://metabase.com)",
      isMarkdown: true,
    });

    await userEvent.click(screen.getByRole("link"));

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByTestId("editable-text")).toHaveTextContent("bold link");
  });

  it("should become editable when a key is pressed", async () => {
    setup({
      initialValue: "original description",
      isMarkdown: true,
    });
    const description = await screen.findByTestId("editable-text");
    description.focus();
    fireEvent.keyDown(description, { key: "b" });
    const textarea = await screen.findByRole("textbox");
    expect(textarea).toHaveFocus();
  });

  it("should become editable when enter key is pressed, without a line break being added to the description", async () => {
    setup({
      initialValue: "original description",
      isMarkdown: true,
    });

    const description = await screen.findByTestId("editable-text");
    description.focus();
    fireEvent.keyUp(description, { key: "Enter" });
    const textarea = await screen.findByRole("textbox");
    expect(textarea).toHaveFocus();
    expect(textarea).toHaveTextContent(/^original description$/);
  });

  describe("when the change is not saved", () => {
    it("shows the initial value again and submits the same text on retry", async () => {
      const onChange = jest.fn((_value: string) => false);
      setup({ initialValue: "Saved", onChange });

      const input = screen.getByRole("textbox");
      await userEvent.clear(input);
      await userEvent.type(input, "Draft");
      await userEvent.tab();

      expect(onChange).toHaveBeenCalledWith("Draft");
      await waitFor(() => expect(input).toHaveValue("Saved"));

      await userEvent.clear(input);
      await userEvent.type(input, "Draft");
      await userEvent.tab();

      expect(onChange).toHaveBeenCalledTimes(2);
      expect(onChange).toHaveBeenNthCalledWith(2, "Draft");
      await waitFor(() => expect(input).toHaveValue("Saved"));
    });

    it("restores the initial value on Escape after a rejected change", async () => {
      setup({ initialValue: "Saved", onChange: () => false });

      const input = screen.getByRole("textbox");
      await userEvent.clear(input);
      await userEvent.type(input, "Draft");
      await userEvent.tab();
      await waitFor(() => expect(input).toHaveValue("Saved"));

      await userEvent.type(input, " edit{Escape}");

      expect(input).toHaveValue("Saved");
    });

    it("does not submit again on blur when there is no initial value", async () => {
      const onChange = jest.fn((_value: string) => false);
      setup({ initialValue: null, isOptional: true, onChange });

      const input = screen.getByRole("textbox");
      await userEvent.type(input, "Draft");
      await userEvent.tab();
      await waitFor(() => expect(input).toHaveValue(""));

      await userEvent.click(input);
      await userEvent.tab();

      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it("keeps the text until the save resolves", async () => {
      const save = defer<boolean>();
      setup({ initialValue: "Saved", onChange: () => save.promise });

      const input = screen.getByRole("textbox");
      await userEvent.clear(input);
      await userEvent.type(input, "Draft");
      await userEvent.tab();

      expect(input).toHaveValue("Draft");

      await act(async () => save.resolve(false));

      expect(input).toHaveValue("Saved");
    });
  });

  it("keeps the submitted text when onChange returns nothing", async () => {
    const onChange = jest.fn((_value: string) => undefined);
    setup({ initialValue: "Saved", onChange });

    const input = screen.getByRole("textbox");
    await userEvent.clear(input);
    await userEvent.type(input, "Draft");
    await userEvent.tab();

    expect(onChange).toHaveBeenCalledWith("Draft");
    expect(input).toHaveValue("Draft");
  });
});
