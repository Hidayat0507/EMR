import NewPatientForm from "./new-patient-form";

type SearchParams = { [key: string]: string | string[] | undefined };

type Props = {
  searchParams?: Promise<SearchParams>;
};

export default async function Page({ searchParams }: Props) {
  const resolvedParams: SearchParams = searchParams
    ? await searchParams.catch(() => ({} as SearchParams))
    : {};

  const fullName = typeof resolvedParams.fullName === "string" ? resolvedParams.fullName : "";
  const nric = typeof resolvedParams.nric === "string" ? resolvedParams.nric : "";
  return <NewPatientForm initialFullName={fullName} initialNric={nric} />;
}
