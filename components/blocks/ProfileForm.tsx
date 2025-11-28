        <div className="space-y-0">
          {/* Band 1: About You */}
          <WizardBand
            id="about-you"
            title="Sobre você"
            description="Isso nos ajuda a adaptar as sugestões à sua rotina real."
            autoSaveStatus={autoSaveStatus['about-you']}
            isActive={currentStep === 'about-you'}
          >
            <AboutYouBlock form={form} errors={errors} onChange={handleChange} />
          </WizardBand>

          {/* Band 2: Children */}
          <WizardBand
            id="children"
            title="Sobre seu(s) filho(s)"
            description="Isso ajuda a personalizar tudo: conteúdo, receitas, atividades."
            autoSaveStatus={autoSaveStatus['children']}
            isActive={currentStep === 'children'}
          >
            <ChildrenBlock
              form={form}
              errors={errors}
              babyBirthdate={babyBirthdate}
              todayISO={todayISO}
              onBirthdateChange={setBabyBirthdate}
              onUpdateChild={updateChild}
              onAddChild={addChild}
              onRemoveChild={removeChild}
            />
          </WizardBand>

          {/* Band 3: Routine & Moments */}
          <WizardBand
            id="routine"
            title="Rotina & momentos críticos"
            description="Aqui a gente entende onde o dia costuma apertar para te ajudar com soluções mais realistas."
            autoSaveStatus={autoSaveStatus['routine']}
            isActive={currentStep === 'routine'}
          >
            <RoutineBlock
              form={form}
              errors={errors}
              onChange={handleChange}
              onToggleArrayField={toggleArrayField}
            />
          </WizardBand>

          {/* Band 4: Support Network */}
          <WizardBand
            id="support"
            title="Rede de apoio"
            description="Conectar você com sua rede pode ser a melhor ajuda."
            autoSaveStatus={autoSaveStatus['support']}
            isActive={currentStep === 'support'}
          >
            <SupportBlock
              form={form}
              onChange={handleChange}
              onToggleArrayField={toggleArrayField}
            />

            {/* Preferences in same band */}
            <div className="border-t border-[var(--color-pink-snow)] pt-6 mt-6">
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-[var(--color-text-main)]">
                  Preferências no app
                </h3>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  Assim a gente personaliza tudo para você.
                </p>
              </div>
              <PreferencesBlock
                form={form}
                onChange={handleChange}
                onToggleArrayField={toggleArrayField}
              />
            </div>
          </WizardBand>
