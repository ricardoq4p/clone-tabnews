import PrayerLayout from "./prayer/Layout";
import Icon from "./prayer/Icon";
export default function AuthLayout({ children, footer }) {
  return (
    <PrayerLayout title="Bem-vindo à nossa casa">
      <div className="p-container p-auth">
        <section>
          <p className="p-eyebrow">UM LUGAR PARA A SUA FÉ</p>
          <h1>
            O caminho fica mais bonito
            <br />
            <em>quando caminhamos juntos.</em>
          </h1>
          <p>
            Entre para guardar suas orações, apresentar intenções e encontrar
            uma comunidade que acolhe.
          </p>
          <div className="p-auth-values">
            <span>
              <Icon name="rosary" />
              Uma oração no seu ritmo
            </span>
            <span>
              <Icon name="candle" />
              Um espaço para suas intenções
            </span>
            <span>
              <Icon name="lock" />
              Cuidado com sua privacidade
            </span>
          </div>
          <p className="p-muted">
            Você também pode rezar o Santo Rosário sem criar uma conta.
          </p>
        </section>
        <section className="p-panel p-auth-form">
          {children}
          {footer ? <div className="p-auth-footer">{footer}</div> : null}
        </section>
      </div>
    </PrayerLayout>
  );
}
