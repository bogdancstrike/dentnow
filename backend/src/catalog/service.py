"""Catalog services (extend CrudService). Global catalog is manager-read-only;
clinic-scoped prices are editable by an assigned clinic manager.
"""
from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import select

from src.catalog.models import (
    Offer,
    OfferFeature,
    Partner,
    Technology,
    Treatment,
    TreatmentCategory,
    TreatmentFaq,
    TreatmentPrice,
)
from src.catalog.serializers import (
    serialize_category,
    serialize_offer,
    serialize_offer_feature,
    serialize_partner,
    serialize_price,
    serialize_technology,
    serialize_treatment,
    serialize_treatment_faq,
)
from src.core.clock import utcnow
from src.core.crud import CrudService
from src.core.errors import ConflictError, ValidationError


class _SlugUnique:
    model: Any
    session: Any

    def _slug_unique(self, obj, creating):
        q = select(self.model.id).where(self.model.slug == obj.slug, self.model.deleted_at.is_(None))
        if not creating:
            q = q.where(self.model.id != obj.id)
        if self.session.scalar(q) is not None:
            raise ConflictError("slug already in use", details={"field": "slug"})


class CategoryService(CrudService, _SlugUnique):
    model = TreatmentCategory
    entity_type = "treatment_category"
    event_prefix = "catalog"
    manager_writable = False
    sortable = ("position", "label", "created_at")
    search_columns = ("label", "slug")

    def serialize(self, obj): return serialize_category(obj)
    def before_write(self, obj, data, *, creating): self._slug_unique(obj, creating)


class TreatmentService(CrudService, _SlugUnique):
    model = Treatment
    entity_type = "treatment"
    event_prefix = "treatment"
    manager_writable = False
    sortable = ("position", "name", "created_at")
    search_columns = ("name", "slug", "summary")

    def serialize(self, obj): return serialize_treatment(obj)

    def to_create_kwargs(self, data):
        data = dict(data)
        if data.get("category_id"):
            data["category_id"] = uuid.UUID(str(data["category_id"]))
        return data

    def to_update_values(self, data, obj):
        data = dict(data)
        if data.get("category_id"):
            data["category_id"] = uuid.UUID(str(data["category_id"]))
        return data

    def before_write(self, obj, data, *, creating): self._slug_unique(obj, creating)


class PriceService(CrudService):
    model = TreatmentPrice
    entity_type = "treatment_price"
    event_prefix = "treatment"
    clinic_scope_column = "clinic_id"  # managers edit only their clinic's prices
    sortable = ("position", "created_at")

    def serialize(self, obj): return serialize_price(obj)

    def to_create_kwargs(self, data):
        data = dict(data)
        data["treatment_id"] = uuid.UUID(str(data["treatment_id"]))
        if data.get("clinic_id"):
            data["clinic_id"] = uuid.UUID(str(data["clinic_id"]))
        return data

    def to_update_values(self, data, obj):
        data = dict(data)
        if data.get("clinic_id"):
            data["clinic_id"] = uuid.UUID(str(data["clinic_id"]))
        return data

    def before_write(self, obj, data, *, creating):
        # A clinic manager may only attach a price to an assigned clinic (never global).
        if self.principal.is_clinic_scoped and (obj.clinic_id is None or obj.clinic_id not in self._scope_ids()):
            raise ValidationError("price must target an assigned clinic")


class TreatmentFaqService(CrudService):
    model = TreatmentFaq
    entity_type = "treatment_faq"
    event_prefix = "treatment"
    manager_writable = False
    sortable = ("position", "created_at")
    search_columns = ("question", "answer")

    def serialize(self, obj): return serialize_treatment_faq(obj)

    def to_create_kwargs(self, data):
        data = dict(data)
        data["treatment_id"] = uuid.UUID(str(data["treatment_id"]))
        return data


class OfferService(CrudService, _SlugUnique):
    model = Offer
    entity_type = "offer"
    event_prefix = "offer"
    manager_writable = False
    sortable = ("position", "name", "status", "created_at")
    search_columns = ("name", "slug", "summary")

    def serialize(self, obj):
        data = serialize_offer(obj)
        rows = self.session.scalars(
            select(OfferFeature)
            .where(OfferFeature.offer_id == obj.id, OfferFeature.deleted_at.is_(None))
            .order_by(OfferFeature.position, OfferFeature.label)
        ).all()
        data["features"] = [r.label for r in rows]
        return data

    def before_write(self, obj, data, *, creating): self._slug_unique(obj, creating)

    # `features` is edited inline but stored in the offer_features child table.
    def to_create_kwargs(self, data):
        data = dict(data)
        data.pop("features", None)
        return data

    def to_update_values(self, data, obj):
        data = dict(data)
        data.pop("features", None)
        return data

    def create(self, data):
        after, etag = super().create(data)
        if data.get("features") is not None:
            self._sync_features(uuid.UUID(after["id"]), data["features"])
            after["features"] = list(data["features"])
        return after, etag

    def update(self, obj_id, data, if_match):
        after, etag = super().update(obj_id, data, if_match)
        if data.get("features") is not None:
            self._sync_features(uuid.UUID(str(obj_id)), data["features"])
            after["features"] = list(data["features"])
        return after, etag

    def _sync_features(self, offer_id, labels):
        """Replace the live offer_features rows for this offer with `labels`."""
        existing = self.session.scalars(
            select(OfferFeature).where(
                OfferFeature.offer_id == offer_id, OfferFeature.deleted_at.is_(None)
            )
        ).all()
        for row in existing:
            row.deleted_at = utcnow()
        for i, label in enumerate(labels):
            self.session.add(OfferFeature(
                offer_id=offer_id, label=label, position=i,
                created_by=self.principal.subject, updated_by=self.principal.subject,
            ))
        self.session.flush()


class OfferFeatureService(CrudService):
    model = OfferFeature
    entity_type = "offer_feature"
    event_prefix = "offer"
    manager_writable = False
    sortable = ("position", "created_at")

    def serialize(self, obj): return serialize_offer_feature(obj)

    def to_create_kwargs(self, data):
        data = dict(data)
        data["offer_id"] = uuid.UUID(str(data["offer_id"]))
        return data


class TechnologyService(CrudService):
    model = Technology
    entity_type = "technology"
    event_prefix = "catalog"
    manager_writable = False
    sortable = ("position", "name", "created_at")
    search_columns = ("name", "description")

    def serialize(self, obj): return serialize_technology(obj)


class PartnerService(CrudService):
    model = Partner
    entity_type = "partner"
    event_prefix = "catalog"
    manager_writable = False
    sortable = ("position", "name", "created_at")
    search_columns = ("name", "relationship_type")

    def serialize(self, obj): return serialize_partner(obj)
