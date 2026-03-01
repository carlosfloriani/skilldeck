import { CommandDef } from '../types'

interface Props {
  command: CommandDef
}

export default function CommandDetail({ command }: Props) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      padding: '16px',
    }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Command
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>
          /{command.id}
        </div>
      </div>

      {command.name && command.name !== command.id && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Name
          </div>
          <div style={{ fontSize: 13, color: '#333' }}>
            {command.name}
          </div>
        </div>
      )}

      {command.description && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Description
          </div>
          <div style={{ fontSize: 12, color: '#555', lineHeight: 1.5 }}>
            {command.description}
          </div>
        </div>
      )}

      {command.arguments.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Arguments
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {command.arguments.map((arg, i) => (
              <div key={i} style={{
                padding: '8px 10px',
                background: '#f8f8f8',
                borderRadius: 6,
                border: '1px solid #eee',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <code style={{
                    fontSize: 11,
                    fontFamily: '"SF Mono", "Fira Code", monospace',
                    color: '#1d4ed8',
                    background: '#eff6ff',
                    padding: '1px 5px',
                    borderRadius: 3,
                  }}>
                    {arg.name}
                  </code>
                  {!arg.required && (
                    <span style={{
                      fontSize: 10,
                      color: '#888',
                      border: '1px solid #ddd',
                      padding: '1px 4px',
                      borderRadius: 3,
                    }}>
                      optional
                    </span>
                  )}
                </div>
                {arg.description && (
                  <div style={{ fontSize: 11, color: '#666' }}>
                    {arg.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {command.arguments.length === 0 && (
        <div style={{ color: '#aaa', fontSize: 12 }}>No arguments</div>
      )}
    </div>
  )
}
