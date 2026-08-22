export default function TeamSetupForm({
  teams,
  onTeamChange,
  onMemberChange,
  onGenerateWallets,
  disabled,
}) {
  const ratioSum = teams.reduce((sum, team) => {
    const ratio = Number(team.ratio)
    return sum + (Number.isFinite(ratio) ? ratio : 0)
  }, 0)

  return (
    <section className="panel">
      <div className="panel-header panel-header-row">
        <div>
          <h2>1. Configure Teams</h2>
          <p>
            Set team names, prize split ratios, and 3 member wallet addresses per team. Names are
            stored locally for admin display only; only addresses go on-chain.
          </p>
        </div>
        <button className="btn secondary" onClick={onGenerateWallets} disabled={disabled}>
          Generate 9 Test Wallets
        </button>
      </div>

      <div className="team-grid">
        {teams.map((team, teamIndex) => {
          const ratio = Number(team.ratio)
          const sharePct =
            ratioSum > 0 && Number.isFinite(ratio) ? ((ratio / ratioSum) * 100).toFixed(1) : '0.0'

          return (
            <article className="team-card" key={teamIndex}>
              <div className="team-card-header">
                <input
                  className="input team-name"
                  value={team.name}
                  onChange={(event) => onTeamChange(teamIndex, 'name', event.target.value)}
                  placeholder="Team name"
                  disabled={disabled}
                />
                <label className="ratio-field">
                  <span>Split ratio</span>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    step="1"
                    value={team.ratio}
                    onChange={(event) => onTeamChange(teamIndex, 'ratio', event.target.value)}
                    disabled={disabled}
                  />
                </label>
              </div>

              <p className="team-share">{sharePct}% of the pool &middot; split 3 ways</p>

              <div className="member-list">
                {team.members.map((member, memberIndex) => (
                  <div className="member-row" key={memberIndex}>
                    <input
                      className="input"
                      value={member.name}
                      onChange={(event) =>
                        onMemberChange(teamIndex, memberIndex, 'name', event.target.value)
                      }
                      placeholder={`Member ${memberIndex + 1} name`}
                      disabled={disabled}
                    />
                    <input
                      className="input mono"
                      value={member.address}
                      onChange={(event) =>
                        onMemberChange(teamIndex, memberIndex, 'address', event.target.value)
                      }
                      placeholder="0x wallet address"
                      disabled={disabled}
                    />
                  </div>
                ))}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
