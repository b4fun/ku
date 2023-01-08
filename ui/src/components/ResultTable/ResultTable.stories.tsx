import { faker } from '@faker-js/faker';
import { ComponentMeta } from '@storybook/react';
import '../../style.css';
import { ResultTable } from './ResultTable';

export default {
  title: 'ResultTable',
  component: ResultTable,
} as ComponentMeta<typeof ResultTable>;

export const Default = () => {
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Bio',
      dataIndex: 'bio',
      key: 'bio',
    },
  ];
  let data = [];
  for (let i = 0; i < 100; i++) {
    data.push({
      name: faker.name.fullName(),
      email: faker.internet.email(),
      bio: faker.random.words(300),
    });
  }
  data = data.map((x, idx) => ({ ...x, key: `${idx}` }));

  return (
    <ResultTable
      viewWidth={600}
      viewModel={{
        columns,
        data,
      }}
    />
  );
};
