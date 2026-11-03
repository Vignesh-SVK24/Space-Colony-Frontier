# Game Balance & Economic Model

## Baseline Consumption Rates (per colonist per game hour)
- **Oxygen**: 0.5 units/h
- **Water**: 0.3 units/h
- **Food**: 0.2 units/h

## Brownout Scaling
When Colony Energy Demand exceeds Total Production:
$$\text{Brownout Factor} = \frac{\text{Total Energy Produced}}{\text{Total Energy Demanded}}$$
- Life support buildings operate at highest priority.
- Industrial extractors and science labs are scaled down proportionally by the brownout factor.
