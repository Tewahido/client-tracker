export const loansPageStyles = {
  toolbar: 'mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between',
  // Phones stack search and sort, each full width; side by side there, the search placeholder got cut off.
  toolbarRight: 'flex flex-col gap-2 sm:flex-row sm:items-center',
  // Same focus look as the search box beside it.
  sort: 'glass select-chevron h-11 w-full rounded-xl pl-3.5 text-sm font-semibold text-fg outline-none transition focus:border-brand-400/60 focus:ring-4 focus:ring-brand-400/15 sm:w-auto',
  list: 'flex flex-col gap-3',
  noResults: 'py-12 text-center text-sm text-muted',
}
