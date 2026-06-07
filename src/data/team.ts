export type TeamGroup =
  | 'professors'
  | 'phd'
  | 'master'
  | 'research-assistants'
  | 'undergraduate-ra'
  | 'alumni'
  | 'collaborators';

export interface PersonLink {
  label: string;
  url: string;
}

export interface Person {
  name: string;
  role: string;
  group: TeamGroup;
  affiliation?: string;
  image?: string;
  researchInterests?: string[];
  shortBio?: string;
  links?: PersonLink[];
}

export const team: Person[] = [];

export const getPeopleByGroup = (group: TeamGroup) => team.filter((person) => person.group === group);
