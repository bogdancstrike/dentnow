import { Button, Result } from 'antd';
import { logout } from '../auth/keycloak';

export function AccessDeniedPage({ title, detail }: { title: string; detail: string }) {
  return (
    <Result
      status="403"
      title={title}
      subTitle={detail}
      extra={
        <Button type="primary" onClick={() => logout()}>
          Deconectare
        </Button>
      }
    />
  );
}
