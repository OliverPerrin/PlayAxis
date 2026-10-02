import React, { StrictMode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import useResource from "./useResource";
import { clearCache } from "../api";

jest.mock("../api", () => ({ clearCache: jest.fn() }));
beforeEach(() => jest.clearAllMocks());

test("StrictMode skips the discarded effect before starting its loader", async () => {
  const loader = jest.fn().mockResolvedValue({ value: 1 });
  const { result } = renderHook(() => useResource("item", loader), {
    wrapper: ({ children }) => <StrictMode>{children}</StrictMode>,
  });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(loader).toHaveBeenCalledTimes(1);
  expect(result.current.data).toEqual({ value: 1 });
});

test("a superseded load cannot replace the newly selected resource", async () => {
  let finishOld;
  const old = new Promise((resolve) => { finishOld = resolve; });
  const loader = jest.fn((key) => key === "old" ? old : Promise.resolve("new data"));
  const { result, rerender } = renderHook(({ name }) => useResource(name, () => loader(name)), {
    initialProps: { name: "old" },
  });
  await waitFor(() => expect(loader).toHaveBeenCalledWith("old"));
  rerender({ name: "new" });
  await waitFor(() => expect(result.current.data).toBe("new data"));
  await act(async () => finishOld("old data"));
  expect(result.current.data).toBe("new data");
});

test("mutation reloads preserve unrelated API caches while explicit refresh invalidates", async () => {
  const loader = jest.fn().mockResolvedValue("data");
  const { result } = renderHook(() => useResource("item", loader));
  await waitFor(() => expect(result.current.loading).toBe(false));
  act(() => result.current.reload({ invalidate: false }));
  await waitFor(() => expect(loader).toHaveBeenCalledTimes(2));
  expect(clearCache).not.toHaveBeenCalled();
  act(() => result.current.reload());
  await waitFor(() => expect(loader).toHaveBeenCalledTimes(3));
  expect(clearCache).toHaveBeenCalledTimes(1);
});
