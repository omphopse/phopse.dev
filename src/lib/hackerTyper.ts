export type GameDifficulty = 'Casual' | 'Normal' | 'Speedrun'
export type MissionId = 'api-breach' | 'firewall-override' | 'zero-day'
export type GameMission = { id: MissionId; name: string; theme: string; objective: string; code: string }
export const difficulties: Record<GameDifficulty, { seconds: number; charsPerKey: number; description: string }> = {
  Casual: { seconds: 30, charsPerKey: 36, description: '30 sec · large code bursts · relaxed reveal' },
  Normal: { seconds: 60, charsPerKey: 23, description: '60 sec · balanced reveal speed' },
  Speedrun: { seconds: 90, charsPerKey: 13, description: '90 sec · smaller bursts · longer code targets' },
}
export const missions: GameMission[] = [
  {
    id: 'api-breach', name: 'Mission 01: API Breach', theme: 'Inspecting a fictional API gateway',
    objective: 'Reveal the request validation and access-control flow.',
    code: `// FICTIONAL TRAINING SIMULATION — no live system is connected\npublic Response handle(Request request) {\n    var parsed = requestParser.parse(request);\n    if (!parsed.isValid()) {\n        return Response.badRequest("invalid request");\n    }\n\n    var identity = authenticator.verify(parsed.token());\n    if (!identity.isAuthenticated()) {\n        return Response.unauthorized();\n    }\n\n    var policy = accessPolicy.forIdentity(identity);\n    if (!policy.allows(parsed.resource(), parsed.action())) {\n        return Response.forbidden();\n    }\n\n    var quota = rateLimiter.check(identity.keyId());\n    if (!quota.allowed()) {\n        return Response.tooManyRequests();\n    }\n\n    return service.execute(parsed.toCommand());\n}`,
  },
  {
    id: 'firewall-override', name: 'Mission 02: Firewall Override', theme: 'A fictional authorization puzzle',
    objective: 'Pass the simulated identity, policy, quota, and audit checkpoints.',
    code: `// FICTIONAL TRAINING SIMULATION — checkpoints are story elements\npublic Result authorize(AccessRequest request) {\n    var input = validator.validate(request);\n    if (input.hasErrors()) {\n        return Result.rejected("request validation failed");\n    }\n\n    var principal = identityProvider.currentPrincipal();\n    var subscription = subscriptions.findActive(\n        principal.id(), input.planId());\n    if (subscription.isEmpty()) {\n        return Result.rejected("active plan required");\n    }\n\n    var withinLimit = limits.check(\n        subscription.get().limit(), input.usage());\n    if (!withinLimit) {\n        return Result.rejected("quota exceeded");\n    }\n\n    audit.record(principal.id(), input.resource(), "ALLOW");\n    return Result.allowed(input.resource());\n}`,
  },
  {
    id: 'zero-day', name: 'Mission 03: Zero Day', theme: 'A fictional backend security challenge',
    objective: 'Complete the longest simulated review with safe validation and error handling.',
    code: `// FICTIONAL TRAINING SIMULATION — illustrative code only\npublic ApiResponse dispatch(ApiRequest request) {\n    var validated = requestValidator.validate(request);\n    if (!validated.isValid()) {\n        return ApiResponse.badRequest("invalid request");\n    }\n\n    var caller = authentication.requireCaller(validated);\n    var entitlement = subscriptionService.requireActive(\n        caller.accountId(), validated.apiId());\n    var decision = authorization.evaluate(\n        caller, entitlement, validated.operation());\n    if (!decision.isAllowed()) {\n        audit.recordDenied(caller.id(), validated.apiId());\n        return ApiResponse.forbidden();\n    }\n\n    var quota = rateLimitService.consume(\n        caller.keyId(), entitlement.requestLimit());\n    if (!quota.accepted()) {\n        return ApiResponse.tooManyRequests();\n    }\n\n    try {\n        var result = providerGateway.forward(\n            validated.apiId(), validated.payload());\n        audit.recordAccepted(caller.id(), validated.apiId());\n        return ApiResponse.ok(result);\n    } catch (ProviderUnavailableException ignored) {\n        return ApiResponse.serviceUnavailable();\n    }\n}`,
  },
]
export const missionEvents = [
  { at: 20, message: 'INITIALIZING SIMULATION' },
  { at: 45, message: 'SECURITY CHECKPOINT PASSED' },
  { at: 70, message: 'COMPILING MODULES' },
  { at: 90, message: 'FINALIZING SEQUENCE' },
  { at: 100, message: 'MISSION COMPLETE' },
] as const
export type Rank = 'Script Kiddie' | 'Debugger' | 'Code Runner' | 'Root Access'
export function calculateScore(progress: number, completed: boolean, secondsRemaining: number) {
  return Math.floor(progress) + (completed ? 500 + Math.max(0, secondsRemaining) * 10 : 0)
}
export function calculateRank(progress: number, completed: boolean, secondsRemaining: number, duration: number): Rank {
  if (completed && secondsRemaining >= duration * 0.75) return 'Root Access'
  if (completed) return 'Code Runner'
  if (progress >= 60) return 'Debugger'
  return 'Script Kiddie'
}

