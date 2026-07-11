"""Aggregate import of every SQLAlchemy model module.

Importing this module registers all ORM tables on ``Base.metadata`` and wires any
``db_event`` listeners. Alembic autogenerate and ``wsgi.py`` both import it so the
full schema is always visible.

The schema is introduced in Task 5 (site/audit/outbox) and extended by later tasks
(clinics, catalog, editorial, media, publication guards). This module stays the
single registration point.
"""
from src.site import models as _site_models  # noqa: F401
from src.audit import models as _audit_models  # noqa: F401
from src.integrations import models as _integration_models  # noqa: F401

# Later tasks append: clinics, catalog, editorial, media, iam.
