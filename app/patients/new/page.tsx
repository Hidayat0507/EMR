import NewPatientForm from "./new-patient-form";

type Props = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page({ searchParams }: Props) {
  const paramsObj = (await searchParams?.catch(() => ({} as Record<string, unknown>))) || ({} as Record<string, unknown>);
  const fullName = typeof paramsObj["fullName"] === 'string' ? (paramsObj["fullName"] as string) : '';
  const nric = typeof paramsObj["nric"] === 'string' ? (paramsObj["nric"] as string) : '';
  return <NewPatientForm initialFullName={fullName} initialNric={nric} />;
}